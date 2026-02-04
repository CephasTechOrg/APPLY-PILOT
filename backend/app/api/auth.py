from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, 
    create_access_token, create_refresh_token, verify_token, hash_token
)
from app.core.config import settings
from app.core.email import send_verification_email, send_password_reset_email
from app.core.rate_limiter import limiter
from app.models.user import User
from app.models.profile import Profile
from app.models.email_verification_token import EmailVerificationToken
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.schemas.user import (
    AuthResponse,
    UserCreate,
    UserResponse,
    TokenResponse,
    UserLogin,
    EmailVerificationRequest,
    ResendVerificationRequest,
    MessageResponse,
    VerifyEmailResponse,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordResetConfirm,
)

router = APIRouter()


def store_refresh_token(db: Session, user_id: int, refresh_token: str) -> None:
    token_hash = hash_token(refresh_token)
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(db_token)

@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        if existing_user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        profile = db.query(Profile).filter(Profile.user_id == existing_user.id).first()
        if not profile:
            profile = Profile(user_id=existing_user.id, open_to_work=True)
            db.add(profile)
            db.commit()
        verification_code = issue_verification_code(db, existing_user)
        if not send_verification_email(existing_user.email, verification_code):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email",
            )
        return existing_user
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    full_name = f"{user_data.first_name.strip()} {user_data.last_name.strip()}".strip()
    db_user = User(
        email=user_data.email,
        first_name=user_data.first_name.strip(),
        last_name=user_data.last_name.strip(),
        full_name=full_name,
        date_of_birth=user_data.date_of_birth,
        password_hash=hashed_password,
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    profile = Profile(user_id=db_user.id, open_to_work=True)
    db.add(profile)
    db.commit()
    
    # Create welcome notifications
    from app.services.notification_service import create_notification
    create_notification(
        db=db,
        user_id=db_user.id,
        title="Welcome to ApplyPilot",
        message="Your AI career copilot is ready. Start tracking applications and tailoring resumes.",
        category="system",
        action_url="/Dashboard",
    )
    create_notification(
        db=db,
        user_id=db_user.id,
        title="Upload your first resume",
        message="Get started by uploading a resume so AI tools can optimize it for each application.",
        category="general",
        action_url="/Resumes/upload",
    )
    create_notification(
        db=db,
        user_id=db_user.id,
        title="Try AI tools",
        message="Use our AI tools to tailor resumes, generate cover letters, and check ATS compatibility.",
        category="ai",
        action_url="/AITools",
    )
    
    verification_code = issue_verification_code(db, db_user)
    if not send_verification_email(db_user.email, verification_code):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email",
        )

    return db_user

@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    
    # Update last login
    user.last_login_at = datetime.utcnow()

    # Create tokens
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    store_refresh_token(db, user.id, refresh_token)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/token", response_model=AuthResponse)
@limiter.limit("10/minute")
async def token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )

    user.last_login_at = datetime.utcnow()

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    store_refresh_token(db, user.id, refresh_token)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }

@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("30/minute")
async def refresh_token(payload: RefreshTokenRequest, request: Request, db: Session = Depends(get_db)):
    payload_data = verify_token(payload.refresh_token)
    if not payload_data or payload_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    token_hash = hash_token(payload.refresh_token)
    token_record = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked_at.is_(None),
        RefreshToken.expires_at >= datetime.utcnow(),
    ).first()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload_data.get("sub")
    token_record.revoked_at = datetime.utcnow()

    new_access_token = create_access_token({"sub": user_id})
    new_refresh_token = create_refresh_token({"sub": user_id})
    store_refresh_token(db, int(user_id), new_refresh_token)
    db.commit()

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


def issue_verification_code(db: Session, user: User) -> str:
    now = datetime.utcnow()
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id,
        EmailVerificationToken.used_at.is_(None),
        EmailVerificationToken.expires_at >= now,
    ).update({"used_at": now})

    code = f"{secrets.randbelow(1_000_000):06d}"
    token_hash = hash_token(code)
    expires_at = now + timedelta(minutes=settings.EMAIL_VERIFICATION_EXPIRE_MINUTES)

    token = EmailVerificationToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(token)
    db.commit()
    return code


@router.post("/verify-email", response_model=VerifyEmailResponse)
@limiter.limit("10/minute")
async def verify_email(payload: EmailVerificationRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.email_verified:
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})
        store_refresh_token(db, user.id, refresh_token)
        db.commit()
        return {
            "message": "Email already verified",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user,
        }

    token_hash = hash_token(payload.code)
    token = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id,
        EmailVerificationToken.token_hash == token_hash,
        EmailVerificationToken.used_at.is_(None),
        EmailVerificationToken.expires_at >= datetime.utcnow(),
    ).first()

    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")

    token.used_at = datetime.utcnow()
    user.email_verified = True

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    store_refresh_token(db, user.id, refresh_token)
    db.commit()

    return {
        "message": "Email verified",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/resend-verification", response_model=MessageResponse)
@limiter.limit("3/minute")
async def resend_verification(payload: ResendVerificationRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.email_verified:
        return {"message": "Email already verified"}

    verification_code = issue_verification_code(db, user)
    if not send_verification_email(user.email, verification_code):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email",
        )

    return {"message": "Verification email sent"}


def issue_password_reset_code(db: Session, user: User) -> str:
    now = datetime.utcnow()
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at >= now,
    ).update({"used_at": now})

    code = f"{secrets.randbelow(1_000_000):06d}"
    token_hash = hash_token(code)
    expires_at = now + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES)

    token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(token)
    db.commit()
    return code


@router.post("/request-password-reset", response_model=MessageResponse)
@limiter.limit("5/minute")
async def request_password_reset(payload: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        code = issue_password_reset_code(db, user)
        if not send_password_reset_email(user.email, code):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send password reset email",
            )

    return {"message": "If the account exists, a reset code was sent."}


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(payload: PasswordResetConfirm, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset code")

    token_hash = hash_token(payload.code)
    token = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at >= datetime.utcnow(),
    ).first()

    if not token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reset code")

    token.used_at = datetime.utcnow()
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "Password updated"}
