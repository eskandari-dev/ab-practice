import os
import sqlite3

DB_PATH = os.getenv("DB_PATH") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.db")


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def create_tables():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    """)

    columns = [row["name"] for row in conn.execute("PRAGMA table_info(users)")]
    if "exams_left" not in columns:
        conn.execute("ALTER TABLE users ADD COLUMN exams_left INTEGER NOT NULL DEFAULT 0")
    if "unlimited_until" not in columns:
        conn.execute("ALTER TABLE users ADD COLUMN unlimited_until TEXT")
    if "google_sub" not in columns:
        conn.execute("ALTER TABLE users ADD COLUMN google_sub TEXT")

    # questions made in the admin test designer; data is the question as JSON
    conn.execute("""
        CREATE TABLE IF NOT EXISTS bank_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            region TEXT NOT NULL,
            data TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            source TEXT,
            created_at TEXT NOT NULL
        )
    """)
    # admin changes to the exam rules in rules.py
    conn.execute("""
        CREATE TABLE IF NOT EXISTS region_rules (
            region TEXT PRIMARY KEY,
            data TEXT NOT NULL
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    # finished exams of logged-in users, so progress follows them to every device
    conn.execute("""
        CREATE TABLE IF NOT EXISTS exam_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            region TEXT NOT NULL,
            score INTEGER NOT NULL,
            total INTEGER NOT NULL,
            seconds INTEGER NOT NULL,
            passed INTEGER NOT NULL,
            mode TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS exam_results_user ON exam_results (user_id)")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            stripe_session_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            plan TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()
