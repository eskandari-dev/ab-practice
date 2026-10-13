"""Save the approved questions from app.db into approved_questions.json, so they can go to GitHub.

Run it after approving questions in the admin page:  python export_questions.py
The server adds new questions from the file, and deletes the ones that are no longer in it, when it starts.
"""
import json

from database import SAVED_QUESTIONS, create_tables, get_db, question_key

create_tables()
conn = get_db()
rows = conn.execute(
    "SELECT id, region, data, source FROM bank_questions WHERE status = 'approved' ORDER BY id"
).fetchall()

questions = []
for row in rows:
    question = json.loads(row["data"])
    questions.append({"region": row["region"], "source": row["source"], "question": question})
    conn.execute("UPDATE bank_questions SET saved_key = ? WHERE id = ?", (question_key(row["region"], question), row["id"]))
conn.commit()
conn.close()

with open(SAVED_QUESTIONS, "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)
    f.write("\n")

print(f"Saved {len(questions)} approved questions to approved_questions.json")
