from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, status
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr, field_validator
from ..core.database import get_session
from ..core.security import hash_password
from ..models.user import User
from ..services.auth import authenticate_user, issue_tokens, refresh_access_token, revoke_refresh_token

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "refresh_token"
COOKIE_MAX_AGE = 7 * 24 * 3600


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


@router.post("/register", status_code=201)
async def register(body: RegisterRequest, response: Response, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=body.email, hashed_password=hash_password(body.password), role="learner")
    session.add(user)
    session.commit()
    session.refresh(user)
    tokens = issue_tokens(user, session)
    response.set_cookie(
        key=COOKIE_NAME,
        value=tokens["refresh_token"],
        httponly=True,
        max_age=COOKIE_MAX_AGE,
        samesite="lax",
    )
    return {"access_token": tokens["access_token"], "token_type": "Bearer", "expires_in": 900}


@router.post("/login")
async def login(body: LoginRequest, response: Response, session: Session = Depends(get_session)):
    user = authenticate_user(body.email, body.password, session)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    tokens = issue_tokens(user, session)
    response.set_cookie(
        key=COOKIE_NAME,
        value=tokens["refresh_token"],
        httponly=True,
        max_age=COOKIE_MAX_AGE,
        samesite="lax",
    )
    return {
        "access_token": tokens["access_token"],
        "token_type": "Bearer",
        "expires_in": 900,
    }


@router.post("/refresh")
async def refresh(
    response: Response,
    session: Session = Depends(get_session),
    refresh_token: str | None = Cookie(default=None),
):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")
    new_access = refresh_access_token(refresh_token, session)
    return {"access_token": new_access, "token_type": "Bearer", "expires_in": 900}


@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    session: Session = Depends(get_session),
    refresh_token: str | None = Cookie(default=None),
):
    if refresh_token:
        revoke_refresh_token(refresh_token, session)
    response.delete_cookie(COOKIE_NAME)
