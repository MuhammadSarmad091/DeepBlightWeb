"""Idempotent bootstrap: ensure a configured admin account exists (Docker / first deploy)."""
import os
from datetime import datetime

from werkzeug.security import generate_password_hash


def ensure_admin_user(users_col):
    """
    If ADMIN_EMAIL is not registered, insert that user with role admin.
    If the user already exists, set role to admin (password unchanged).
    Credentials default to a dev-friendly pair; override with env in production.
    """
    email = (os.environ.get("ADMIN_EMAIL") or "admin@deepblight.local").lower().strip()
    password = os.environ.get("ADMIN_PASSWORD") or "DeepBlightAdmin2026!"
    username = (os.environ.get("ADMIN_USERNAME") or "admin").strip() or "admin"

    if not email:
        return

    existing = users_col.find_one({"email": email})
    hashed = generate_password_hash(password)

    if existing:
        users_col.update_one(
            {"email": email},
            {"$set": {"role": "admin"}},
        )
        return

    users_col.insert_one(
        {
            "username": username,
            "email": email,
            "password": hashed,
            "role": "admin",
            "created_at": datetime.utcnow(),
        }
    )
    print(f"✓ Seeded admin user: {email} (change ADMIN_PASSWORD in production)")
