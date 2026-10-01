import os
import random
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone

import stripe
from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# imported after load_dotenv() so DB_PATH from .env is used
from database import create_tables, get_db
from questions import questions
from security import check_password, hash_password

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

FREE_QUESTIONS = 5
FULL_QUESTIONS = 20
SESSION_DAYS = 30

# price is in cents (CAD)
PLANS = {
    "starter": {"name": "Starter", "price": 499, "exams": 3, "days": 0},
    "standard": {"name": "Standard", "price": 999, "exams": 10, "days": 0},
    "unlimited": {"name": "Unlimited", "price": 1499, "exams": 0, "days": 30},
}

app = FastAPI()
create_tables()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
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
    conn: sqlite3.Connection = Depends(get_conn),
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


@app.get("/")
def home():
    return {"message": "AB Practice API"}


class UserIn(BaseModel):
    email: str
    password: str


@app.post("/register")
def register(data: UserIn, conn: sqlite3.Connection = Depends(get_conn)):
    email = data.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Please enter a valid email")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    cursor = conn.execute(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        (email, hash_password(data.password)),
    )
    conn.commit()
    token = create_session(conn, cursor.lastrowid)
    return {"token": token, "user": user_to_dict(load_user(conn, cursor.lastrowid))}


@app.post("/login")
def login(data: UserIn, conn: sqlite3.Connection = Depends(get_conn)):
    email = data.email.strip().lower()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if user is None or not check_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Wrong email or password")
    token = create_session(conn, user["id"])
    return {"token": token, "user": user_to_dict(user)}


@app.post("/logout")
def logout(
    authorization: str | None = Header(default=None),
    conn: sqlite3.Connection = Depends(get_conn),
):
    if authorization and authorization.startswith("Bearer "):
        conn.execute("DELETE FROM sessions WHERE token = ?", (authorization.removeprefix("Bearer "),))
        conn.commit()
    return {"message": "Logged out"}


@app.get("/me")
def me(user=Depends(current_user)):
    return user_to_dict(user)


@app.post("/exam/start")
def start_exam(user=Depends(optional_user), conn: sqlite3.Connection = Depends(get_conn)):
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

    count = FULL_QUESTIONS if mode == "full" else FREE_QUESTIONS
    picked = random.sample(questions, min(count, len(questions)))
    return {
        "mode": mode,
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
                "product_data": {"name": "AB Practice - " + plan["name"]},
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
    try:
        conn.execute(
            "INSERT INTO payments (stripe_session_id, user_id, plan, created_at) VALUES (?, ?, ?, ?)",
            (stripe_session_id, user_id, plan_key, now().isoformat()),
        )
    except sqlite3.IntegrityError:
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
    conn: sqlite3.Connection = Depends(get_conn),
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
async def stripe_webhook(request: Request, conn: sqlite3.Connection = Depends(get_conn)):
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook")
    if event["type"] == "checkout.session.completed":
        handle_paid_session(conn, event["data"]["object"])
    return {"received": True}
