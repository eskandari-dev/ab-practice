import json
import os
import random
import secrets
from datetime import datetime, timedelta, timezone

import stripe
from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from pydantic import BaseModel

# imported after load_dotenv() so DB_PATH from .env is used
from ai import AIError, extract_text, generate_questions
from database import create_tables, get_db
from questions import questions
from rules import DEFAULT_RULES
from rate_limit import feedback_limit, generate_limit, login_failures, register_limit
from security import check_password, hash_password
from signs import SIGN_NAMES

# comma-separated; the first one is used for payment redirects
FRONTEND_URLS = [u.strip().rstrip("/") for u in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",") if u.strip()]
FRONTEND_URL = FRONTEND_URLS[0]
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
ADMIN_EMAILS = {e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()}
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "")

FREE_QUESTIONS = 5
SESSION_DAYS = 30

# price is in cents (CAD)
PLANS = {
    "starter": {"name": "Starter", "price": 499, "exams": 3, "days": 0},
    "standard": {"name": "Standard", "price": 999, "exams": 10, "days": 0},
    "unlimited": {"name": "Unlimited", "price": 1499, "exams": 0, "days": 30},
}

# region ids must match frontend/src/places.js
BUILT_IN_QUESTIONS = {
    "ca-ab": questions,
}

app = FastAPI()
create_tables()
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now():
    return datetime.now(timezone.utc)


def get_conn():
    conn = get_db()
    try:
        yield conn
    finally:
        conn.close()


def optional_user(
    authorization: str | None = Header(default=None),
    conn=Depends(get_conn),
):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ")
    row = conn.execute(
        """
        SELECT users.*, sessions.created_at AS session_created
        FROM sessions JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ?
        """,
        (token,),
    ).fetchone()
    if row is None:
        return None
    if datetime.fromisoformat(row["session_created"]) + timedelta(days=SESSION_DAYS) < now():
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        return None
    return row


def current_user(user=Depends(optional_user)):
    if user is None:
        raise HTTPException(status_code=401, detail="Please log in")
    return user


def has_unlimited(user):
    return user["unlimited_until"] is not None and datetime.fromisoformat(user["unlimited_until"]) > now()


def user_to_dict(user):
    unlimited = has_unlimited(user)
    return {
        "email": user["email"],
        "exams_left": user["exams_left"],
        "unlimited_until": user["unlimited_until"] if unlimited else None,
        "has_access": unlimited or user["exams_left"] > 0,
        "is_admin": user["email"] in ADMIN_EMAILS,
        "has_password": bool(user["password_hash"]),
        "google": user["google_sub"] is not None,
    }


def load_user(conn, user_id):
    return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def create_session(conn, user_id):
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, now().isoformat()),
    )
    conn.commit()
    return token


def require_admin(user=Depends(current_user)):
    if user["email"] not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admins only")
    return user


def get_rules(conn, region):
    row = conn.execute("SELECT data FROM region_rules WHERE region = ?", (region,)).fetchone()
    if row:
        return json.loads(row["data"])
    return DEFAULT_RULES.get(region)


def get_bank(conn, region):
    bank = list(BUILT_IN_QUESTIONS.get(region, []))
    rows = conn.execute(
        "SELECT id, data FROM bank_questions WHERE region = ? AND status = 'approved'", (region,)
    ).fetchall()
    # "b" keeps these ids apart from the built-in question ids
    bank += [{**json.loads(row["data"]), "id": "b" + str(row["id"])} for row in rows]
    return bank


def pick_questions(bank, rules, count, full):
    if full and rules["sections"]:
        picked = []
        for section in rules["sections"]:
            pool = [q for q in bank if q.get("section") == section["key"]]
            if len(pool) < section["questions"]:
                break
            picked += random.sample(pool, section["questions"])
        else:
            return picked, True
    return random.sample(bank, min(count, len(bank))), False


@app.get("/")
def home():
    return {"message": "Road Ready API"}


@app.get("/health")
def health(conn=Depends(get_conn)):
    # a tiny DB read proves the API and the database both work
    conn.execute("SELECT 1")
    return {"ok": True}


@app.get("/config")
def config():
    firebase = None
    if FIREBASE_API_KEY and FIREBASE_PROJECT_ID:
        # the web config is public by design; it only identifies the Firebase project
        firebase = {
            "apiKey": FIREBASE_API_KEY,
            "authDomain": f"{FIREBASE_PROJECT_ID}.firebaseapp.com",
            "projectId": FIREBASE_PROJECT_ID,
        }
    return {"firebase": firebase, "payments": bool(stripe.api_key), "support_email": SUPPORT_EMAIL}


@app.get("/regions")
def regions(conn=Depends(get_conn)):
    result = {}
    for region in DEFAULT_RULES:
        result[region] = {**get_rules(conn, region), "available": len(get_bank(conn, region))}
    return result


class GoogleIn(BaseModel):
    credential: str


@app.post("/auth/google")
def google_login(data: GoogleIn, conn=Depends(get_conn)):
    if not FIREBASE_PROJECT_ID:
        raise HTTPException(status_code=503, detail="Google login is not set up yet")
    try:
        info = google_id_token.verify_firebase_token(data.credential, google_requests.Request(), FIREBASE_PROJECT_ID)
    except ValueError as error:
        print(f"Firebase token rejected: {error}")
        raise HTTPException(status_code=401, detail="Google login failed (invalid token)")
    if not info or not info.get("email"):
        raise HTTPException(status_code=401, detail="Google login failed (no email)")
    if not info.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google login failed (email not verified)")
    if info.get("firebase", {}).get("sign_in_provider") != "google.com":
        raise HTTPException(status_code=401, detail="Google login failed (not a Google account)")

    email = info["email"].lower()
    user = conn.execute(
        "SELECT * FROM users WHERE google_sub = ? OR email = ?", (info["sub"], email)
    ).fetchone()
    if user is None:
        user_id = conn.execute(
            "INSERT INTO users (email, password_hash, google_sub, created_at) VALUES (?, '', ?, ?) RETURNING id",
            (email, info["sub"], now().isoformat()),
        ).fetchone()["id"]
    else:
        user_id = user["id"]
        if user["google_sub"] is None:
            conn.execute("UPDATE users SET google_sub = ? WHERE id = ?", (info["sub"], user_id))
    conn.commit()
    token = create_session(conn, user_id)
    return {"token": token, "user": user_to_dict(load_user(conn, user_id))}


class UserIn(BaseModel):
    email: str
    password: str


@app.post("/register")
def register(data: UserIn, request: Request, conn=Depends(get_conn)):
    email = data.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Please enter a valid email")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    ip = request.client.host if request.client else ""
    register_limit.check(ip)
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = conn.execute(
        "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?) RETURNING id",
        (email, hash_password(data.password), now().isoformat()),
    ).fetchone()["id"]
    conn.commit()
    token = create_session(conn, user_id)
    return {"token": token, "user": user_to_dict(load_user(conn, user_id))}


@app.post("/login")
def login(data: UserIn, request: Request, conn=Depends(get_conn)):
    email = data.email.strip().lower()
    key = (request.client.host if request.client else "", email)
    # peek without counting: the helper records on check(), so wrong passwords use a manual path
    recent = [t for t in login_failures.hits.get(key, []) if now() - t < login_failures.window]
    if len(recent) >= login_failures.limit:
        raise HTTPException(status_code=429, detail="Too many attempts. Please wait a few minutes.")
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if user is None or not check_password(data.password, user["password_hash"]):
        login_failures.hits[key] = recent + [now()]
        raise HTTPException(status_code=401, detail="Wrong email or password")
    login_failures.hits.pop(key, None)
    token = create_session(conn, user["id"])
    return {"token": token, "user": user_to_dict(user)}


@app.post("/logout")
def logout(
    authorization: str | None = Header(default=None),
    conn=Depends(get_conn),
):
    if authorization and authorization.startswith("Bearer "):
        conn.execute("DELETE FROM sessions WHERE token = ?", (authorization.removeprefix("Bearer "),))
        conn.commit()
    return {"message": "Logged out"}


@app.get("/me")
def me(user=Depends(current_user)):
    return user_to_dict(user)


class PasswordIn(BaseModel):
    current: str
    new: str


@app.post("/me/password")
def change_password(
    data: PasswordIn,
    authorization: str | None = Header(default=None),
    user=Depends(current_user),
    conn=Depends(get_conn),
):
    if not check_password(data.current, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is wrong")
    if len(data.new) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(data.new), user["id"]))
    # keep this device logged in, log out every other device
    conn.execute(
        "DELETE FROM sessions WHERE user_id = ? AND token != ?",
        (user["id"], authorization.removeprefix("Bearer ")),
    )
    conn.commit()
    return {"message": "Password changed"}


@app.delete("/me")
def delete_account(user=Depends(current_user), conn=Depends(get_conn)):
    # payments are kept as purchase records
    conn.execute("DELETE FROM exam_results WHERE user_id = ?", (user["id"],))
    conn.execute("DELETE FROM sessions WHERE user_id = ?", (user["id"],))
    conn.execute("DELETE FROM users WHERE id = ?", (user["id"],))
    conn.commit()
    return {"message": "Account deleted"}


class ResultIn(BaseModel):
    region: str
    score: int
    total: int
    seconds: int
    passed: bool
    mode: str


@app.post("/results")
def save_result(data: ResultIn, user=Depends(current_user), conn=Depends(get_conn)):
    if data.region not in DEFAULT_RULES or data.mode not in ("free", "full", "mistakes"):
        raise HTTPException(status_code=400, detail="Invalid result")
    if not (1 <= data.total <= 200 and 0 <= data.score <= data.total and 0 <= data.seconds <= 86400):
        raise HTTPException(status_code=400, detail="Invalid result")
    conn.execute(
        """
        INSERT INTO exam_results (user_id, region, score, total, seconds, passed, mode, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (user["id"], data.region, data.score, data.total, data.seconds, int(data.passed), data.mode, now().isoformat()),
    )
    conn.commit()
    return {"message": "Saved"}


@app.get("/results")
def list_results(user=Depends(current_user), conn=Depends(get_conn)):
    rows = conn.execute(
        """
        SELECT region, score, total, seconds, passed, mode, created_at FROM exam_results
        WHERE user_id = ? ORDER BY id DESC LIMIT 200
        """,
        (user["id"],),
    ).fetchall()
    return [
        {
            "region": row["region"],
            "score": row["score"],
            "total": row["total"],
            "seconds": row["seconds"],
            "passed": bool(row["passed"]),
            "mode": row["mode"],
            "date": row["created_at"],
        }
        for row in reversed(rows)
    ]


class FeedbackIn(BaseModel):
    message: str
    email: str = ""
    page: str = ""


@app.post("/feedback")
def send_feedback(
    data: FeedbackIn,
    request: Request,
    user=Depends(optional_user),
    conn=Depends(get_conn),
):
    message = data.message.strip()
    if not 3 <= len(message) <= 2000:
        raise HTTPException(status_code=400, detail="Please write a message (up to 2000 characters)")
    ip = request.client.host if request.client else ""
    feedback_limit.check(ip)
    email = user["email"] if user is not None else data.email.strip().lower()[:200]
    conn.execute(
        "INSERT INTO feedback (user_id, email, message, page, created_at) VALUES (?, ?, ?, ?, ?)",
        (user["id"] if user is not None else None, email, message, data.page[:200], now().isoformat()),
    )
    conn.commit()
    return {"message": "Thank you"}


class ExamIn(BaseModel):
    region: str = "ca-ab"


@app.post("/exam/start")
def start_exam(
    data: ExamIn | None = None,
    user=Depends(optional_user),
    conn=Depends(get_conn),
):
    region = data.region if data else "ca-ab"
    rules = get_rules(conn, region)
    bank = get_bank(conn, region) if rules else []
    if not bank:
        raise HTTPException(status_code=404, detail="This region is coming soon")

    mode = "free"
    if user is not None:
        if has_unlimited(user):
            mode = "full"
        else:
            cursor = conn.execute(
                "UPDATE users SET exams_left = exams_left - 1 WHERE id = ? AND exams_left > 0",
                (user["id"],),
            )
            conn.commit()
            if cursor.rowcount == 1:
                mode = "full"

    count = rules["questions"] if mode == "full" else FREE_QUESTIONS
    picked, use_sections = pick_questions(bank, rules, count, mode == "full")
    return {
        "mode": mode,
        "rules": {**rules, "use_sections": use_sections},
        "questions": picked,
        "user": user_to_dict(load_user(conn, user["id"])) if user is not None else None,
    }


class CheckoutIn(BaseModel):
    plan: str


@app.post("/checkout")
def checkout(data: CheckoutIn, user=Depends(current_user)):
    plan = PLANS.get(data.plan)
    if plan is None:
        raise HTTPException(status_code=400, detail="Unknown plan")
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Payments are not set up yet")
    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "cad",
                "product_data": {"name": "Road Ready - " + plan["name"]},
                "unit_amount": plan["price"],
            },
            "quantity": 1,
        }],
        customer_email=user["email"],
        metadata={"plan": data.plan, "user_id": str(user["id"])},
        success_url=FRONTEND_URL + "/payment-success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url=FRONTEND_URL + "/pricing",
    )
    return {"url": session.url}


def grant_plan(conn, stripe_session_id, user_id, plan_key):
    plan = PLANS[plan_key]
    cursor = conn.execute(
        """
        INSERT INTO payments (stripe_session_id, user_id, plan, created_at) VALUES (?, ?, ?, ?)
        ON CONFLICT (stripe_session_id) DO NOTHING
        """,
        (stripe_session_id, user_id, plan_key, now().isoformat()),
    )
    if cursor.rowcount == 0:
        # this payment was already given to the user
        return
    if plan["exams"]:
        conn.execute("UPDATE users SET exams_left = exams_left + ? WHERE id = ?", (plan["exams"], user_id))
    if plan["days"]:
        user = load_user(conn, user_id)
        start = datetime.fromisoformat(user["unlimited_until"]) if has_unlimited(user) else now()
        until = start + timedelta(days=plan["days"])
        conn.execute("UPDATE users SET unlimited_until = ? WHERE id = ?", (until.isoformat(), user_id))
    conn.commit()


def handle_paid_session(conn, session):
    if session["payment_status"] != "paid":
        return False
    metadata = session["metadata"]
    grant_plan(conn, session["id"], int(metadata["user_id"]), metadata["plan"])
    return True


class VerifyIn(BaseModel):
    session_id: str


@app.post("/checkout/verify")
def verify_checkout(
    data: VerifyIn,
    user=Depends(current_user),
    conn=Depends(get_conn),
):
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Payments are not set up yet")
    try:
        session = stripe.checkout.Session.retrieve(data.session_id)
    except stripe.StripeError:
        raise HTTPException(status_code=400, detail="Payment not found")
    if session["metadata"]["user_id"] != str(user["id"]):
        raise HTTPException(status_code=403, detail="This payment belongs to another account")
    if not handle_paid_session(conn, session):
        raise HTTPException(status_code=400, detail="Payment is not complete yet")
    return user_to_dict(load_user(conn, user["id"]))


@app.post("/stripe/webhook")
async def stripe_webhook(request: Request, conn=Depends(get_conn)):
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook")
    if event["type"] == "checkout.session.completed":
        handle_paid_session(conn, event["data"]["object"])
    return {"received": True}


# ---------- admin: test designer ----------

def bank_row_to_dict(row):
    return {
        "id": row["id"],
        "region": row["region"],
        "status": row["status"],
        "source": row["source"],
        "created_at": row["created_at"],
        "question": json.loads(row["data"]),
    }


@app.post("/admin/generate")
async def admin_generate(
    region: str = Form(...),
    region_name: str = Form(...),
    count: int = Form(10),
    languages: str = Form("en"),
    text: str = Form(""),
    file: UploadFile | None = File(default=None),
    admin=Depends(require_admin),
    conn=Depends(get_conn),
):
    rules = get_rules(conn, region)
    if rules is None:
        raise HTTPException(status_code=400, detail="Unknown region")
    if not 1 <= count <= 30:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 30")
    generate_limit.check(admin["email"])

    source = text
    source_name = "pasted text"
    if file is not None and file.filename:
        raw = await file.read()
        if len(raw) > 8_000_000:
            raise HTTPException(status_code=400, detail="File is too large (max 8 MB)")
        source = extract_text(file.filename, raw) + "\n" + text
        source_name = file.filename

    langs = [code for code in languages.split(",") if code]
    try:
        made = generate_questions(source, count, langs, region_name, rules["sections"], SIGN_NAMES)
    except AIError as error:
        raise HTTPException(status_code=503, detail=str(error))

    created = now().isoformat()
    ids = []
    for question in made:
        row = conn.execute(
            "INSERT INTO bank_questions (region, data, status, source, created_at) VALUES (?, ?, 'draft', ?, ?) RETURNING id",
            (region, json.dumps(question, ensure_ascii=False), source_name, created),
        ).fetchone()
        ids.append(row["id"])
    conn.commit()
    rows = conn.execute(
        f"SELECT * FROM bank_questions WHERE id IN ({','.join('?' * len(ids))})", ids
    ).fetchall() if ids else []
    return [bank_row_to_dict(row) for row in rows]


@app.get("/admin/questions")
def admin_questions(
    region: str,
    status: str = "",
    admin=Depends(require_admin),
    conn=Depends(get_conn),
):
    sql = "SELECT * FROM bank_questions WHERE region = ?"
    params = [region]
    if status:
        sql += " AND status = ?"
        params.append(status)
    rows = conn.execute(sql + " ORDER BY id DESC", params).fetchall()
    return [bank_row_to_dict(row) for row in rows]


@app.get("/admin/signs")
def admin_signs(admin=Depends(require_admin)):
    return [{"id": sign_id, "name": name, "url": f"/signs/{sign_id}.png"} for sign_id, name in SIGN_NAMES.items()]


class QuestionUpdate(BaseModel):
    question: dict | None = None
    status: str | None = None


def validate_question(q):
    if not isinstance(q.get("en"), str) or len(q.get("options", {}).get("en", [])) != 3 or q.get("correct") not in (0, 1, 2):
        raise HTTPException(status_code=400, detail="A question needs English text, 3 options and a correct answer")
    image = q.get("image")
    if image is not None and image not in SIGN_NAMES:
        raise HTTPException(status_code=400, detail="Unknown road sign image")


@app.put("/admin/questions/{question_id}")
def admin_update_question(
    question_id: int,
    data: QuestionUpdate,
    admin=Depends(require_admin),
    conn=Depends(get_conn),
):
    if data.status is not None and data.status not in ("draft", "approved"):
        raise HTTPException(status_code=400, detail="Status must be draft or approved")
    if data.question is not None:
        q = data.question
        validate_question(q)
        if q.get("image") is None:
            q.pop("image", None)
        conn.execute(
            "UPDATE bank_questions SET data = ? WHERE id = ?", (json.dumps(q, ensure_ascii=False), question_id)
        )
    if data.status is not None:
        conn.execute("UPDATE bank_questions SET status = ? WHERE id = ?", (data.status, question_id))
    conn.commit()
    row = conn.execute("SELECT * FROM bank_questions WHERE id = ?", (question_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return bank_row_to_dict(row)


@app.delete("/admin/questions/{question_id}")
def admin_delete_question(
    question_id: int,
    admin=Depends(require_admin),
    conn=Depends(get_conn),
):
    conn.execute("DELETE FROM bank_questions WHERE id = ?", (question_id,))
    conn.commit()
    return {"deleted": question_id}


class RulesIn(BaseModel):
    questions: int
    pass_correct: int
    time_limit: int | None = None
    sections: list[dict] = []
    note: str = ""
    verified: bool = False


@app.put("/admin/rules/{region}")
def admin_update_rules(
    region: str,
    data: RulesIn,
    admin=Depends(require_admin),
    conn=Depends(get_conn),
):
    if region not in DEFAULT_RULES:
        raise HTTPException(status_code=400, detail="Unknown region")
    if not 1 <= data.pass_correct <= data.questions:
        raise HTTPException(status_code=400, detail="Pass mark must be between 1 and the number of questions")
    conn.execute(
        "INSERT INTO region_rules (region, data) VALUES (?, ?) ON CONFLICT(region) DO UPDATE SET data = excluded.data",
        (region, json.dumps(data.model_dump(), ensure_ascii=False)),
    )
    conn.commit()
    return get_rules(conn, region)


@app.get("/admin/feedback")
def admin_feedback(admin=Depends(require_admin), conn=Depends(get_conn)):
    rows = conn.execute(
        "SELECT id, email, message, page, created_at FROM feedback ORDER BY id DESC LIMIT 200"
    ).fetchall()
    return [dict(row) for row in rows]


@app.delete("/admin/feedback/{feedback_id}")
def admin_delete_feedback(feedback_id: int, admin=Depends(require_admin), conn=Depends(get_conn)):
    conn.execute("DELETE FROM feedback WHERE id = ?", (feedback_id,))
    conn.commit()
    return {"deleted": feedback_id}


@app.get("/admin/stats")
def admin_stats(admin=Depends(require_admin), conn=Depends(get_conn)):
    week_ago = (now() - timedelta(days=7)).isoformat()

    def count(sql, params=()):
        return conn.execute(sql, params).fetchone()["n"]

    return {
        "users": count("SELECT COUNT(*) AS n FROM users"),
        "new_users_week": count("SELECT COUNT(*) AS n FROM users WHERE created_at >= ?", (week_ago,)),
        "exams": count("SELECT COUNT(*) AS n FROM exam_results"),
        "exams_week": count("SELECT COUNT(*) AS n FROM exam_results WHERE created_at >= ?", (week_ago,)),
        "payments": count("SELECT COUNT(*) AS n FROM payments"),
        "feedback": count("SELECT COUNT(*) AS n FROM feedback"),
    }
