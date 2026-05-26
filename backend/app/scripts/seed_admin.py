"""
Create an admin user. Run inside the backend container:
  python -m app.scripts.seed_admin --email admin@example.com --password yourpassword
"""
import argparse
from sqlmodel import Session, select
from ..core.config import settings
from ..core.database import create_db_and_tables, engine
from ..core.security import hash_password
from ..models.user import User


def main():
    parser = argparse.ArgumentParser(description="Seed an admin user")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    create_db_and_tables()
    with Session(engine) as session:
        existing = session.exec(select(User).where(User.email == args.email)).first()
        if existing:
            print(f"[skip] {args.email} already exists (role={existing.role})")
            return
        user = User(
            email=args.email,
            hashed_password=hash_password(args.password),
            role="admin",
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"[created] admin: {args.email} (id={user.id})")


if __name__ == "__main__":
    main()
