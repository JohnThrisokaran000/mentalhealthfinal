from datetime import UTC, datetime
from hashlib import sha256

import jwt
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.database.models import RefreshSession, User
from app.database.session import get_db
from app.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.audit import log_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def user_response(user: User) -> UserResponse:
    return UserResponse(id=user.id, email=user.email, name=user.name, role=user.role, onboarding_complete=user.onboarding_complete, mfa_enabled=user.mfa_enabled)


def issue_tokens(db: Session, user: User) -> TokenResponse:
    refresh, refresh_hash, refresh_expiry = create_refresh_token(user.id)
    db.add(RefreshSession(user_id=user.id, token_hash=refresh_hash, expires_at=refresh_expiry))
    return TokenResponse(access_token=create_access_token(user.id, user.role), refresh_token=refresh)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = User(email=payload.email.lower(), name=payload.name, password_hash=hash_password(payload.password))
    db.add(user)
    db.flush()
    log_audit(db, request=request, actor_id=user.id, action="register", target_type="User", target_id=user.id)
    tokens = issue_tokens(db, user)
    db.commit()
    return tokens


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    now = datetime.now(UTC)
    if not user or not user.password_hash or (user.locked_until and user.locked_until > now) or not verify_password(payload.password, user.password_hash):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                from datetime import timedelta
                user.locked_until = now + timedelta(minutes=15)
            log_audit(db, request=request, actor_id=user.id, action="failed_login", target_type="User", target_id=user.id)
            db.commit()
        raise HTTPException(status_code=401, detail="Invalid credentials or temporarily locked account")
    user.failed_login_attempts = 0
    user.locked_until = None
    log_audit(db, request=request, actor_id=user.id, action="login", target_type="User", target_id=user.id)
    tokens = issue_tokens(db, user)
    db.commit()
    return tokens


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    refresh_token = payload.refresh_token
    settings = get_settings()
    try:
        decoded = jwt.decode(refresh_token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as error:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from error
    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == sha256(refresh_token.encode()).hexdigest()))
    if not session or session.revoked_at or session.expires_at < datetime.now(UTC):
        raise HTTPException(status_code=401, detail="Refresh session is unavailable")
    user = db.get(User, session.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Refresh session is unavailable")
    session.revoked_at = datetime.now(UTC)  # rotation
    tokens = issue_tokens(db, user)
    db.commit()
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest, request: Request, user: User = Depends(current_user), db: Session = Depends(get_db)) -> None:
    token_hash = sha256(payload.refresh_token.encode()).hexdigest()
    session = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == token_hash, RefreshSession.user_id == user.id))
    if session:
        session.revoked_at = datetime.now(UTC)
    log_audit(db, request=request, actor_id=user.id, action="logout")
    db.commit()


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(current_user)) -> UserResponse:
    return user_response(user)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password() -> dict[str, str]:
    # An email provider should consume an opaque, single-use reset token in production.
    return {"message": "If an account exists, reset instructions will be sent."}


@router.post("/reset-password", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def reset_password() -> dict[str, str]:
    raise HTTPException(status_code=501, detail="Configure an email delivery provider before enabling password resets")


@router.get("/google", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def google_oidc() -> dict[str, str]:
    raise HTTPException(status_code=501, detail="Google OIDC requires configured client credentials")
