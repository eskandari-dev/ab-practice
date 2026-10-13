"""API tests. Run from the backend folder:  python -m unittest discover tests"""
import json
import os
import shutil
import sys
import tempfile
import unittest

TEMP_DIR = tempfile.mkdtemp()
# set before main is imported; load_dotenv() never overrides variables that already exist
os.environ.update({
    "DB_PATH": os.path.join(TEMP_DIR, "test.db"),
    # never the real database from .env; set TEST_DATABASE_URL to run the tests on an empty Postgres
    "DATABASE_URL": os.getenv("TEST_DATABASE_URL", ""),
    "STATIC_DIR": TEMP_DIR,
    "ADMIN_EMAILS": "admin@example.com",
    "FIREBASE_API_KEY": "",
    "FIREBASE_PROJECT_ID": "",
    "STRIPE_SECRET_KEY": "",
})
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
with open(os.path.join(TEMP_DIR, "index.html"), "w") as f:
    f.write("<!doctype html><title>AB Practice</title>")

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
import main  # noqa: E402
import server  # noqa: E402

api = TestClient(main.app)
PASSWORD = "password123"


def tearDownModule():
    shutil.rmtree(TEMP_DIR, ignore_errors=True)


def auth(token):
    return {"Authorization": "Bearer " + token}


class ApiTest(unittest.TestCase):
    counter = 0

    def setUp(self):
        main.failed_logins.clear()

    def new_user(self, email=None):
        ApiTest.counter += 1
        email = email or f"user{ApiTest.counter}@example.com"
        r = api.post("/register", json={"email": email, "password": PASSWORD})
        self.assertEqual(r.status_code, 200, r.text)
        return email, r.json()["token"]

    def admin_token(self):
        r = api.post("/login", json={"email": "admin@example.com", "password": PASSWORD})
        if r.status_code == 200:
            return r.json()["token"]
        return self.new_user("admin@example.com")[1]


class AccountTests(ApiTest):
    def test_register_checks_email_and_password(self):
        self.assertEqual(api.post("/register", json={"email": "nope", "password": PASSWORD}).status_code, 400)
        self.assertEqual(api.post("/register", json={"email": "a@b.com", "password": "short"}).status_code, 400)

    def test_register_twice_fails(self):
        email, _ = self.new_user()
        r = api.post("/register", json={"email": email.upper(), "password": PASSWORD})
        self.assertEqual(r.json()["detail"], "Email already registered")

    def test_login_and_me(self):
        email, _ = self.new_user()
        self.assertEqual(api.post("/login", json={"email": email, "password": "wrong-pass"}).status_code, 401)
        r = api.post("/login", json={"email": email, "password": PASSWORD})
        self.assertEqual(r.status_code, 200)
        me = api.get("/me", headers=auth(r.json()["token"])).json()
        self.assertEqual(me["email"], email)
        self.assertTrue(me["has_password"])
        self.assertFalse(me["is_admin"])

    def test_me_needs_login(self):
        self.assertEqual(api.get("/me").status_code, 401)
        self.assertEqual(api.get("/me", headers=auth("made-up-token")).status_code, 401)

    def test_login_is_blocked_after_five_wrong_passwords(self):
        email, _ = self.new_user()
        for _ in range(main.LOGIN_LIMIT):
            api.post("/login", json={"email": email, "password": "wrong-pass"})
        r = api.post("/login", json={"email": email, "password": PASSWORD})
        self.assertEqual(r.status_code, 429)

    def test_logout_ends_the_session(self):
        _, token = self.new_user()
        api.post("/logout", headers=auth(token))
        self.assertEqual(api.get("/me", headers=auth(token)).status_code, 401)

    def test_change_password_logs_out_other_devices(self):
        email, token = self.new_user()
        other = api.post("/login", json={"email": email, "password": PASSWORD}).json()["token"]
        wrong = api.post("/me/password", json={"current": "wrong-pass", "new": "newpassword1"}, headers=auth(token))
        self.assertEqual(wrong.status_code, 400)
        ok = api.post("/me/password", json={"current": PASSWORD, "new": "newpassword1"}, headers=auth(token))
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(api.get("/me", headers=auth(token)).status_code, 200)
        self.assertEqual(api.get("/me", headers=auth(other)).status_code, 401)
        self.assertEqual(api.post("/login", json={"email": email, "password": "newpassword1"}).status_code, 200)

    def test_delete_account(self):
        email, token = self.new_user()
        self.assertEqual(api.delete("/me", headers=auth(token)).status_code, 200)
        self.assertEqual(api.get("/me", headers=auth(token)).status_code, 401)
        self.assertEqual(api.post("/login", json={"email": email, "password": PASSWORD}).status_code, 401)

    def test_google_login_and_payments_are_off_without_keys(self):
        config = api.get("/config").json()
        self.assertIsNone(config["firebase"])
        self.assertFalse(config["payments"])
        self.assertEqual(api.post("/auth/google", json={"credential": "x"}).status_code, 503)


class ResultTests(ApiTest):
    result = {"region": "ca-ab", "score": 27, "total": 30, "seconds": 600, "passed": True, "mode": "full"}

    def test_save_and_list_results(self):
        _, token = self.new_user()
        self.assertEqual(api.post("/results", json=self.result, headers=auth(token)).status_code, 200)
        results = api.get("/results", headers=auth(token)).json()
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["score"], 27)

    def test_bad_results_are_refused(self):
        _, token = self.new_user()
        for bad in ({"score": 31}, {"region": "xx"}, {"mode": "cheat"}, {"total": 0, "score": 0}):
            r = api.post("/results", json={**self.result, **bad}, headers=auth(token))
            self.assertEqual(r.status_code, 400, bad)

    def test_results_need_login(self):
        self.assertEqual(api.get("/results").status_code, 401)


class ExamTests(ApiTest):
    def test_guest_gets_a_free_exam(self):
        r = api.post("/exam/start", json={"region": "ca-ab"}).json()
        self.assertEqual(r["mode"], "free")
        self.assertEqual(len(r["questions"]), main.FREE_QUESTIONS)

    def test_unknown_region_is_coming_soon(self):
        self.assertEqual(api.post("/exam/start", json={"region": "xx-yy"}).status_code, 404)

    def test_paid_exam_uses_one_exam_from_the_pack(self):
        email, token = self.new_user()
        conn = main.get_db()
        conn.execute("UPDATE users SET exams_left = 1 WHERE email = ?", (email,))
        conn.commit()
        conn.close()
        first = api.post("/exam/start", json={"region": "ca-ab"}, headers=auth(token)).json()
        self.assertEqual(first["mode"], "full")
        self.assertEqual(first["user"]["exams_left"], 0)
        second = api.post("/exam/start", json={"region": "ca-ab"}, headers=auth(token)).json()
        self.assertEqual(second["mode"], "free")


class AdminTests(ApiTest):
    def test_admin_pages_are_protected(self):
        self.assertEqual(api.get("/admin/questions?region=ca-ab").status_code, 401)
        _, token = self.new_user()
        self.assertEqual(api.get("/admin/questions?region=ca-ab", headers=auth(token)).status_code, 403)

    def test_approved_questions_go_into_exams(self):
        token = self.admin_token()
        question = {"en": "Test question?", "options": {"en": ["A", "B", "C"]}, "correct": 1}
        conn = main.get_db()
        question_id = conn.execute(
            "INSERT INTO bank_questions (region, data, status, created_at) VALUES ('ca-bc', ?, 'draft', 'now') RETURNING id",
            (json.dumps(question),),
        ).fetchone()["id"]
        conn.commit()
        conn.close()
        self.assertEqual(api.post("/exam/start", json={"region": "ca-bc"}).status_code, 404)

        r = api.put(f"/admin/questions/{question_id}", json={"status": "approved"}, headers=auth(token))
        self.assertEqual(r.status_code, 200)
        exam = api.post("/exam/start", json={"region": "ca-bc"}).json()
        self.assertEqual(exam["questions"][0]["en"], "Test question?")

    def test_stats(self):
        _, token = self.new_user("stats-admin@example.com")
        self.assertEqual(api.get("/admin/stats", headers=auth(token)).status_code, 403)
        main.ADMIN_EMAILS.add("stats-admin@example.com")
        try:
            stats = api.get("/admin/stats", headers=auth(token)).json()
        finally:
            main.ADMIN_EMAILS.discard("stats-admin@example.com")
        self.assertGreaterEqual(stats["users"], 1)
        self.assertGreaterEqual(stats["new_users_week"], 1)


class SavedQuestionsTests(unittest.TestCase):
    def question(self, text):
        return {"en": text, "options": {"en": ["A", "B", "C"]}, "correct": 0}

    def sync(self, texts):
        path = os.path.join(TEMP_DIR, "saved.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump([{"region": "xx-test", "source": "t", "question": self.question(t)} for t in texts], f)
        real_file = database.SAVED_QUESTIONS
        database.SAVED_QUESTIONS = path
        conn = database.get_db()
        try:
            database.load_saved_questions(conn)
            conn.commit()
            rows = conn.execute("SELECT id, data FROM bank_questions WHERE region = 'xx-test' ORDER BY id").fetchall()
        finally:
            conn.close()
            database.SAVED_QUESTIONS = real_file
        return {json.loads(r["data"])["en"]: r["id"] for r in rows}

    def tearDown(self):
        conn = database.get_db()
        conn.execute("DELETE FROM bank_questions WHERE region = 'xx-test'")
        conn.commit()
        conn.close()

    def test_server_follows_the_file(self):
        first = self.sync(["one", "two"])
        self.assertEqual(set(first), {"one", "two"})
        self.assertEqual(self.sync(["one", "two"]), first)

        conn = database.get_db()
        conn.execute(
            "INSERT INTO bank_questions (region, data, status, created_at) VALUES ('xx-test', ?, 'approved', 'now')",
            (json.dumps(self.question("made on the server")),),
        )
        conn.commit()
        conn.close()

        second = self.sync(["two", "three"])
        self.assertEqual(set(second), {"two", "three", "made on the server"})
        self.assertEqual(second["two"], first["two"])

    def test_old_rows_are_adopted_not_copied(self):
        conn = database.get_db()
        conn.execute(
            "INSERT INTO bank_questions (region, data, status, created_at) VALUES ('xx-test', ?, 'approved', 'now')",
            (json.dumps(self.question("old")),),
        )
        conn.commit()
        conn.close()
        self.assertEqual(list(self.sync(["old"])), ["old"])
        self.assertEqual(list(self.sync([])), [])


class FeedbackTests(ApiTest):
    def setUp(self):
        super().setUp()
        main.recent_feedback.clear()

    def test_guest_and_user_feedback_reach_the_admin(self):
        self.assertEqual(api.post("/feedback", json={"message": "Great site", "email": "Guest@Example.com"}).status_code, 200)
        email, token = self.new_user()
        api.post("/feedback", json={"message": "Question 3 is wrong", "page": "/practice"}, headers=auth(token))

        admin = self.admin_token()
        messages = api.get("/admin/feedback", headers=auth(admin)).json()
        self.assertEqual(messages[0]["email"], email)
        self.assertEqual(messages[0]["page"], "/practice")
        self.assertEqual(messages[1]["email"], "guest@example.com")

        api.delete(f"/admin/feedback/{messages[0]['id']}", headers=auth(admin))
        self.assertEqual(len(api.get("/admin/feedback", headers=auth(admin)).json()), len(messages) - 1)

    def test_feedback_is_checked_and_limited(self):
        self.assertEqual(api.post("/feedback", json={"message": " "}).status_code, 400)
        for _ in range(main.FEEDBACK_LIMIT):
            api.post("/feedback", json={"message": "hello there"})
        self.assertEqual(api.post("/feedback", json={"message": "hello there"}).status_code, 429)


class ServerTests(unittest.TestCase):
    site = TestClient(server.app)

    def test_pages_fall_back_to_the_react_app(self):
        for path in ("/", "/practice", "/account"):
            r = self.site.get(path)
            self.assertEqual(r.status_code, 200, path)
            self.assertIn("AB Practice", r.text)

    def test_api_is_under_api(self):
        self.assertEqual(self.site.get("/api/config").status_code, 200)

    def test_security_headers(self):
        r = self.site.get("/")
        self.assertEqual(r.headers["X-Frame-Options"], "DENY")
        self.assertEqual(r.headers["X-Content-Type-Options"], "nosniff")
        self.assertEqual(r.headers["Cache-Control"], "no-cache")


if __name__ == "__main__":
    unittest.main()
