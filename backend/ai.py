import io
import json
import os
import random

from openai import OpenAI
from pypdf import PdfReader

LANGUAGE_NAMES = {
    "en": "English", "zh": "Simplified Chinese", "es": "Spanish", "fr": "French", "de": "German",
    "pt": "Portuguese", "ar": "Arabic", "fa": "Persian", "hi": "Hindi",
}
MAX_SOURCE_CHARS = 60000


class AIError(Exception):
    pass


def extract_text(filename, content):
    if filename.lower().endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return content.decode("utf-8", errors="ignore")


def build_prompt(source, count, languages, region_name, sections):
    section_rule = ""
    if sections:
        keys = ", ".join(f'"{s["key"]}" ({s["name"]})' for s in sections)
        section_rule = f'- Give every question a "section" field, one of: {keys}. Spread the questions over the sections.\n'
    langs = ", ".join(f'"{code}" ({LANGUAGE_NAMES[code]})' for code in languages)
    return f"""You write practice questions for the driver's knowledge test of {region_name}.
Use ONLY facts from the SOURCE below. Do not invent rules, numbers or signs that are not in the source.

Write {count} multiple-choice questions.
- Exactly 3 answer options per question, exactly one correct.
- Wrong options must be believable but clearly wrong according to the source.
- Keep sentences short and clear.
- Write every question, option and explanation in these languages: {langs}.
{section_rule}
Return JSON only, in this exact shape:
{{"questions": [{{
  "section": "<key or null>",
  "text": {{"en": "...", ...one entry per language}},
  "options": {{"en": ["...", "...", "..."], ...one list per language, same order in every language}},
  "correct": 0,
  "explanation": {{"en": "one short sentence why the answer is correct", ...one entry per language}}
}}]}}

SOURCE:
{source[:MAX_SOURCE_CHARS]}"""


def to_bank_format(item, languages, sections):
    text = item.get("text") or {}
    options = item.get("options") or {}
    correct = item.get("correct")
    if not isinstance(correct, int) or not 0 <= correct <= 2:
        return None
    if not all(isinstance(text.get(code), str) and len(options.get(code) or []) == 3 for code in languages):
        return None

    # models tend to put the correct answer first, so shuffle every language the same way
    order = [0, 1, 2]
    random.shuffle(order)

    question = {code: text[code].strip() for code in languages}
    question["options"] = {code: [str(options[code][i]).strip() for i in order] for code in languages}
    question["correct"] = order.index(correct)
    explanation = item.get("explanation") or {}
    question["explanation"] = {code: explanation[code] for code in languages if isinstance(explanation.get(code), str)}
    section_keys = {s["key"] for s in sections}
    if item.get("section") in section_keys:
        question["section"] = item["section"]
    return question


def generate_questions(source, count, languages, region_name, sections):
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise AIError("AI is not set up yet")
    if not source.strip():
        raise AIError("The resource has no readable text")
    if "en" not in languages:
        languages = ["en", *languages]

    client = OpenAI(api_key=api_key)
    try:
        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": build_prompt(source, count, languages, region_name, sections)}],
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
    except Exception as error:
        raise AIError("AI request failed: " + str(error)) from error

    questions = [to_bank_format(item, languages, sections) for item in data.get("questions", [])]
    return [q for q in questions if q is not None]
