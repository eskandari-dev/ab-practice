import hashlib
import json
import os
import sqlite3
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.getenv("DB_PATH") or os.path.join(BASE_DIR, "app.db")
# a Postgres URL (for example from Neon); when it is empty the SQLite file at DB_PATH is used
DATABASE_URL = os.getenv("DATABASE_URL", "")
# written by export_questions.py and kept in git
SAVED_QUESTIONS = os.path.join(BASE_DIR, "approved_questions.json")

pool = None


class PgConnection:
    """Gives a Postgres connection the small part of the sqlite3 API the app uses."""

    def __init__(self, conn):
        self.conn = conn

    def execute(self, sql, params=()):
        return self.conn.execute(sql.replace("?", "%s"), params)

    def commit(self):
        self.conn.commit()

    def close(self):
        # end the read-only transaction that every SELECT opens
        self.conn.rollback()
        pool.putconn(self.conn)


def get_db():
    global pool
    if DATABASE_URL:
        if pool is None:
            from psycopg.rows import dict_row
            from psycopg_pool import ConnectionPool

            pool = ConnectionPool(
                DATABASE_URL,
                min_size=1,
                max_size=5,
                kwargs={"row_factory": dict_row},
                # free Postgres hosts close idle connections, so test each one before use
                check=ConnectionPool.check_connection,
            )
        return PgConnection(pool.getconn())
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def add_column(conn, table, column, definition):
    if DATABASE_URL:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column} {definition}")
        return
    columns = [row["name"] for row in conn.execute(f"PRAGMA table_info({table})")]
    if column not in columns:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def create_tables(sync_saved_questions=True):
    conn = get_db()
    id_column = "SERIAL PRIMARY KEY" if DATABASE_URL else "INTEGER PRIMARY KEY AUTOINCREMENT"
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS users (
            id {id_column},
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    """)
    add_column(conn, "users", "exams_left", "INTEGER NOT NULL DEFAULT 0")
    add_column(conn, "users", "unlimited_until", "TEXT")
    add_column(conn, "users", "google_sub", "TEXT")
    add_column(conn, "users", "created_at", "TEXT")

    # questions made in the admin test designer; data is the question as JSON
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS bank_questions (
            id {id_column},
            region TEXT NOT NULL,
            data TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            source TEXT,
            created_at TEXT NOT NULL
        )
    """)
    # set on questions that came from approved_questions.json
    add_column(conn, "bank_questions", "saved_key", "TEXT")
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
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS exam_results (
            id {id_column},
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
    # messages from the feedback form; user_id is empty for visitors who are not logged in
    conn.execute(f"""
        CREATE TABLE IF NOT EXISTS feedback (
            id {id_column},
            user_id INTEGER,
            email TEXT,
            message TEXT NOT NULL,
            page TEXT,
            created_at TEXT NOT NULL
        )
    """)
    if sync_saved_questions:
        load_saved_questions(conn)
    conn.commit()
    conn.close()


def question_key(region, question):
    text = json.dumps(question, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256((region + "\n" + text).encode("utf-8")).hexdigest()


def load_saved_questions(conn):
    """Make the questions that came from approved_questions.json match the file.

    Questions are made on the admin's computer and reach the server through git, so on every start new ones
    are added and ones removed from the file are deleted. Questions made on the server itself are not touched.
    """
    if not os.path.exists(SAVED_QUESTIONS):
        return
    with open(SAVED_QUESTIONS, encoding="utf-8") as f:
        saved = {question_key(item["region"], item["question"]): item for item in json.load(f)}

    rows = conn.execute("SELECT id, region, data, status, saved_key FROM bank_questions ORDER BY id").fetchall()
    known = set()
    for row in rows:
        key = row["saved_key"]
        if key is None:
            # rows from before saved_key existed: adopt them if they match the file
            if row["status"] != "approved":
                continue
            key = question_key(row["region"], json.loads(row["data"]))
            if key not in saved or key in known:
                continue
            conn.execute("UPDATE bank_questions SET saved_key = ? WHERE id = ?", (key, row["id"]))
        if key in saved and key not in known:
            # a question from the file that an admin moved back to draft stays a draft
            known.add(key)
        elif row["status"] == "approved":
            conn.execute("DELETE FROM bank_questions WHERE id = ?", (row["id"],))

    created = datetime.now(timezone.utc).isoformat()
    for key, item in saved.items():
        if key in known:
            continue
        conn.execute(
            "INSERT INTO bank_questions (region, data, status, source, created_at, saved_key) VALUES (?, ?, 'approved', ?, ?, ?)",
            (item["region"], json.dumps(item["question"], ensure_ascii=False), item.get("source"), created, key),
        )
