from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.ratelimit import limiter
from app.core.security import (
    create_access_token,
    create_reset_token,
    decode_reset_token,
    hash_password,
    verify_password,
)
from app.models import ActivityLog, User
from app.schemas.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
)
from app.services import mailer

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
@limiter.limit("10/hour")
def signup(request: Request, body: SignupRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == body.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        full_name=body.full_name or body.email.split("@")[0],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    db.add(ActivityLog(user_id=user.id, kind="login", description="Logged in", xp=0))
    db.commit()
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@limiter.limit("5/hour")
def forgot_password(request: Request, body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    # Always return the same message so callers can't tell which emails exist.
    generic = "If an account exists for that email, a password reset link has been sent."
    if not user:
        return ForgotPasswordResponse(message=generic, reset_link=None)

    token = create_reset_token(str(user.id))
    link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
    mailer.send_email(
        user.email,
        "Reset your EditMentor AI password",
        f"Hi {user.full_name or ''},\n\nReset your password with this link "
        f"(valid for 30 minutes):\n{link}\n\nIf you didn't request this, ignore this email.",
    )
    # SECURITY: never return the reset link/token to the caller in production —
    # doing so would let anyone reset any account. Only surfaced in local DEBUG.
    return ForgotPasswordResponse(
        message=generic, reset_link=link if settings.DEBUG else None
    )


@router.post("/reset-password", response_model=TokenResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user_id = decode_reset_token(body.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user = db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user.hashed_password = hash_password(body.password)
    db.add(ActivityLog(user_id=user.id, kind="account", description="Reset password", xp=0))
    db.commit()
    return TokenResponse(access_token=create_access_token(str(user.id)))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
