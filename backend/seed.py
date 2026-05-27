"""
Development seed script — creates an admin and a learner account.
Run: python seed.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.core.database import create_db_and_tables
from app.core.security import hash_password as get_password_hash
from app.models.user import User
from sqlmodel import Session, create_engine, select

ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "adminpass123")
LEARNER_EMAIL = os.getenv("SEED_LEARNER_EMAIL", "learner@example.com")
LEARNER_PASSWORD = os.getenv("SEED_LEARNER_PASSWORD", "learnerpass123")

engine = create_engine(settings.database_url)


def seed():
    create_db_and_tables()
    with Session(engine) as session:
        for email, password, role in [
            (ADMIN_EMAIL, ADMIN_PASSWORD, "admin"),
            (LEARNER_EMAIL, LEARNER_PASSWORD, "learner"),
        ]:
            existing = session.exec(select(User).where(User.email == email)).first()
            if existing:
                print(f"[skip] {email} already exists")
                continue
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                role=role,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            print(f"[created] {role}: {email} (id={user.id})")


if __name__ == "__main__":
    seed()
