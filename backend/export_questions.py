"""Save the approved questions from app.db into approved_questions.json, so they can go to GitHub.

Run it after approving questions in the admin page:  python export_questions.py
"""
import json

from database import SAVED_QUESTIONS, get_db

conn = get_db()
rows = conn.execute(
    "SELECT region, data, source FROM bank_questions WHERE status = 'approved' ORDER BY id"
).fetchall()
conn.close()

questions = [{"region": r["region"], "source": r["source"], "question": json.loads(r["data"])} for r in rows]
with open(SAVED_QUESTIONS, "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"Saved {len(questions)} approved questions to approved_questions.json")
