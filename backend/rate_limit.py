"""Simple in-memory rate limits. They reset when the server restarts."""
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException


def now():
    return datetime.now(timezone.utc)


class RateLimit:
    def __init__(self, limit, window):
        self.limit = limit
        self.window = window
        self.hits = defaultdict(list)

    def clear(self):
        self.hits.clear()

    def check(self, key, detail="Too many attempts. Please wait a few minutes."):
        recent = [t for t in self.hits[key] if now() - t < self.window]
        if len(recent) >= self.limit:
            self.hits[key] = recent
            raise HTTPException(status_code=429, detail=detail)
        self.hits[key] = recent + [now()]


# wrong passwords for one IP + email
login_failures = RateLimit(5, timedelta(minutes=15))
# new accounts from one IP
register_limit = RateLimit(8, timedelta(hours=1))
# feedback messages from one IP
feedback_limit = RateLimit(5, timedelta(hours=1))
# AI question generation from one admin
generate_limit = RateLimit(20, timedelta(hours=1))
