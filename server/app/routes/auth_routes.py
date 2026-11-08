"""
Auth routes:
  POST /auth/signup        -> sends OTP to email
  POST /auth/verify-otp    -> verifies OTP, creates user, returns JWT
  POST /auth/signin        -> email + password -> returns JWT
  GET  /auth/me            -> returns current user from JWT
"""

import os
import secrets
import smtplib

from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

import jwt
import bcrypt

from app.config import RUNTIME_CONFIG
from app.core.database import get_db
from app.models.models import User, Milestone
from app.core.redis_client import redis_client


router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


# ── Config ───────────────────────────────────────────────────────────────────

AUTH_CONFIG = RUNTIME_CONFIG["auth"]
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_EXPIRE_DAYS = AUTH_CONFIG["jwt_expire_days"]
JWT_ALGORITHM = AUTH_CONFIG["jwt_algorithm"]
OTP_EXPIRE_SECONDS = AUTH_CONFIG["otp_expire_seconds"]
OTP_LENGTH = AUTH_CONFIG["otp_length"]
SMTP_HOST = AUTH_CONFIG["smtp_host"]
SMTP_PORT = AUTH_CONFIG["smtp_port"]
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_APP_PASSWORD")


# ── Schemas ──────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


# ── Helpers ──────────────────────────────────────────────────────────────────

def generate_otp(length=OTP_LENGTH):
    return "".join(secrets.choice("0123456789") for _ in range(length))


def store_otp(email: str, otp: str):
    # Store OTP in Redis with expiry
    # Key: otp:email@example.com
    # Value: 123456

    redis_client.setex(
        f"otp:{email}",
        OTP_EXPIRE_SECONDS,
        otp
    )


def get_otp(email: str):
    return redis_client.get(f"otp:{email}")


def delete_otp(email: str):
    redis_client.delete(f"otp:{email}")


def send_otp_email(to_email: str, otp: str, name: str):

    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Email service not configured."
        )

    msg = MIMEMultipart("alternative")

    msg["Subject"] = "GyanSetu - Your Verification Code"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#F7F8FA;border-radius:16px;">

      <div style="text-align:center;margin-bottom:24px;">

        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#3730a3;border-radius:50%;">
          <span style="color:white;font-size:20px;font-weight:700;">GS</span>
        </div>

        <h2 style="margin:12px 0 0;color:#0f172a;font-size:20px;">
          GyanSetu
        </h2>

      </div>

      <div style="background:white;border-radius:12px;padding:28px;text-align:center;">

        <p style="color:#475569;margin:0 0 8px;">
          Hi {name},
        </p>

        <p style="color:#475569;margin:0 0 24px;">
          Your verification code is:
        </p>

        <div style="background:#eef2ff;border-radius:12px;padding:20px;letter-spacing:12px;font-size:32px;font-weight:700;color:#3730a3;">
          {otp}
        </div>

        <p style="color:#94a3b8;font-size:13px;margin:20px 0 0;">
          This code expires in 1 minute.
        </p>

      </div>

      <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">
        If you didn't request this, please ignore this email.
      </p>

    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:

        server.starttls()

        server.login(
            SMTP_EMAIL,
            SMTP_PASSWORD
        )

        server.sendmail(
            SMTP_EMAIL,
            to_email,
            msg.as_string()
        )


def create_jwt(email: str, name: str):
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT service is not configured.")

    payload = {
        "email": email,
        "name": name,
        "initial": name[0].upper(),
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS),
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def decode_jwt(token: str):
    if not JWT_SECRET:
        raise HTTPException(status_code=500, detail="JWT service is not configured.")

    try:

        return jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    return decode_jwt(credentials.credentials)


# ── Signup ───────────────────────────────────────────────────────────────────

@router.post("/signup")
def signup(
    body: SignupRequest,
    db: Session = Depends(get_db)
):

    email = body.email.lower()

    existing = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing and existing.verified:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password
    hashed = bcrypt.hashpw(
        body.password.encode(),
        bcrypt.gensalt()
    ).decode()

    if existing:

        existing.name = body.name
        existing.hashed_password = hashed

        db.commit()

    else:

        user = User(
            name=body.name,
            email=email,
            hashed_password=hashed,
            verified=False
        )

        db.add(user)
        db.commit()

    # Generate OTP
    otp = generate_otp()

    # Store OTP in Redis
    store_otp(
        email,
        otp
    )

    send_otp_email(email, otp, body.name)

    return {
        "message": "OTP sent successfully"
    }


# ── Verify OTP ───────────────────────────────────────────────────────────────

@router.post("/verify-otp")
def verify_otp(
    body: VerifyOTPRequest,
    db: Session = Depends(get_db)
):

    email = body.email.lower()

    # Get OTP from Redis
    stored_otp = get_otp(email)

    if not stored_otp:

        raise HTTPException(
            status_code=400,
            detail="OTP expired or not found. Please sign up again."
        )

    # Compare OTP
    if body.otp != stored_otp:

        raise HTTPException(
            status_code=400,
            detail="Incorrect OTP."
        )

    # Find user
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=400,
            detail="User not found. Please sign up first."
        )

    # ─────────────────────────────────────────────
    # Mark user as verified
    # ─────────────────────────────────────────────

    user.verified = True

    # ─────────────────────────────────────────────
    # Create Joined GyanSetu milestone
    # ─────────────────────────────────────────────

    joined = Milestone(
        user_email=email,
        label="Joined GyanSetu"
    )

    db.add(joined)

    # Commit user verification + milestone together
    db.commit()

    # ─────────────────────────────────────────────
    # Delete OTP from Redis
    # ─────────────────────────────────────────────

    delete_otp(email)

    # ─────────────────────────────────────────────
    # Generate JWT
    # ─────────────────────────────────────────────

    token = create_jwt(
        email,
        user.name
    )

    return {
        "token": token,
        "user": {
            "name": user.name,
            "email": email,
            "initial": user.name[0].upper(),
        },
    }


# ── Signin ───────────────────────────────────────────────────────────────────

@router.post("/signin")
def signin(
    body: SigninRequest,
    db: Session = Depends(get_db)
):

    email = body.email.lower()

    user = (
        db.query(User)
        .filter(
            User.email == email,
            User.verified == True
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not bcrypt.checkpw(
        body.password.encode(),
        user.hashed_password.encode()
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_jwt(
        email,
        user.name
    )

    return {
        "token": token,
        "user": {
            "name": user.name,
            "email": email,
            "initial": user.name[0].upper(),
        },
    }


# ── Current User ─────────────────────────────────────────────────────────────

@router.get("/me")
def get_me(
    current_user=Depends(get_current_user)
):

    return current_user