# AB Practice — Driving Theory Practice Exams

A full-stack web app for practising driving knowledge tests. Users choose their country and
region, and every exam follows that region's official format (number of questions, pass mark,
time limit and separately-passed sections). Admins create new questions with AI from official
handbooks, review them, and publish them.

## Features

- **Region-aware exams.** 28 regions in 6 countries, each with its own rules — for example
  Alberta has 30 questions and 25 correct answers to pass; Ontario has two 20-question parts
  that must each be passed.
- **9 languages** (English, 中文, Español, Français, Deutsch, Português, العربية, فارسی, हिन्दी),
  with right-to-left layout for Arabic and Persian.
- **Exam experience:** timer, keyboard shortcuts, explanations, answer review, progress stats,
  and a "practice my mistakes" mode.
- **Accounts:** email/password and "Continue with Google" (Google Identity Services).
- **AI test designer (admin):** upload a PDF/TXT handbook; OpenAI writes multilingual questions
  using only facts from the source. Questions stay as drafts until an admin approves them.
- **Payments:** Stripe Checkout with exam packs and a monthly unlimited plan.

## Tech stack

| Part | Tools |
| --- | --- |
| Frontend | React 19, Vite, React Router |
| Backend | Python, FastAPI, SQLite |
| Integrations | Google Identity Services, OpenAI API, Stripe |
| Deploy | Docker (one container serves the site and the API) |

## Run locally

Backend (Python 3.11):

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env         # then fill in the values you need
uvicorn main:app --reload
```

Frontend (Node 20+):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Deploy

The `Dockerfile` builds the React site and runs FastAPI, which serves the API under `/api` and
the site on every other path (`backend/server.py`). Mount a persistent volume at `/data` for the
SQLite database and set the variables from `backend/.env.example` on the host.

## Project structure

```
backend/
  main.py        API: auth, exams, payments, admin
  rules.py       official exam rules for each region
  ai.py          AI question generator
  server.py      production entry point (API + site)
frontend/src/
  pages/         Home, Practice, Admin, Login, Pricing, ...
  i18n/          translations for 9 languages
```
