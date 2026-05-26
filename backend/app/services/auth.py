import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from ..core.config import settings
from ..core.security import hash_password, verify_password, create_access_token
from ..models.user import User
from ..models.refresh_token import RefreshToken


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def authenticate_user(email: str, password: str, session: Session) -> User | None:
    user = session.exec(select(User).where(User.email == email)).first()
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def issue_tokens(user: User, session: Session) -> dict:
    access_token = create_access_token(user.id, user.role)
    raw_refresh = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    token_record = RefreshToken(
        user_id=user.id,
        token_hash=_hash_token(raw_refresh),
        expires_at=expires_at,
    )
    session.add(token_record)
    session.commit()
    return {"access_token": access_token, "refresh_token": raw_refresh}


def refresh_access_token(raw_refresh: str, session: Session) -> str:
    token_hash = _hash_token(raw_refresh)
    record = session.exec(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
        )
    ).first()
    if not record or record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalid or expired")
    user = session.get(User, record.user_id)
    if not user or not user.is_active:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return create_access_token(user.id, user.role)


def revoke_refresh_token(raw_refresh: str, session: Session) -> None:
    token_hash = _hash_token(raw_refresh)
    record = session.exec(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).first()
    if record:
        record.revoked = True
        session.add(record)
        session.commit()
