"""
Auth routes:
  POST /auth/signup        -> sends OTP to email
  POST /auth/verify-otp   -> verifies OTP, creates user, returns JWT
  POST /auth/signin        -> email + password -> returns JWT
  GET  /auth/me            -> returns current user from JWT
"""

import os
import random
import string
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

from database import get_db
from models import User
from redis_client import redis_client  # ← Redis replaces OTP_STORE dict

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

# ── Config ───────────────────────────────────────────────────────────────────
JWT_SECRET = "6a76f0cfa0e26e4185a036a69f6fba56bb9103a656a334a1334ae6bca90dcede"
JWT_EXPIRE_DAYS = 7
OTP_EXPIRE_SECONDS = 60  # 10 minutes

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = "noreplygyansetu@gmail.com"
SMTP_PASSWORD = "lxux kdnc aowh eulv"


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
def generate_otp(length=6):
    return "".join(random.choices(string.digits, k=length))


def store_otp(email: str, otp: str):
    # Store OTP in Redis with 10 min expiry
    # Key: otp:email@example.com → Value: "123456"
    redis_client.setex(f"otp:{email}", OTP_EXPIRE_SECONDS, otp)
    print(f"OTP stored in Redis for {email}: {otp}")


def get_otp(email: str):
    return redis_client.get(f"otp:{email}")


def delete_otp(email: str):
    redis_client.delete(f"otp:{email}")


def send_otp_email(to_email: str, otp: str, name: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="Email service not configured.")

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
        <h2 style="margin:12px 0 0;color:#0f172a;font-size:20px;">GyanSetu</h2>
      </div>
      <div style="background:white;border-radius:12px;padding:28px;text-align:center;">
        <p style="color:#475569;margin:0 0 8px;">Hi {name},</p>
        <p style="color:#475569;margin:0 0 24px;">Your verification code is:</p>
        <div style="background:#eef2ff;border-radius:12px;padding:20px;letter-spacing:12px;font-size:32px;font-weight:700;color:#3730a3;">
          {otp}
        </div>
        <p style="color:#94a3b8;font-size:13px;margin:20px 0 0;">This code expires in 1 minutes.</p>
      </div>
      <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px;">
        If you didn't request this, please ignore this email.
      </p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())


def create_jwt(email: str, name: str):
    payload = {
        "email": email,
        "name": name,
        "initial": name[0].upper(),
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_jwt(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return decode_jwt(credentials.credentials)


# ── Debug ─────────────────────────────────────────────────────────────────────
@router.get("/debug")
def debug(db: Session = Depends(get_db)):
    users = db.query(User).all()
    # Check Redis for any stored OTPs
    keys = redis_client.keys("otp:*")
    otp_store = {k.replace("otp:", ""): redis_client.get(k) for k in keys}
    return {
        "otp_store": otp_store,
        "users": [u.email for u in users]
    }


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/signup")
def signup(body: SignupRequest, db: Session = Depends(get_db)):
    print("========== SIGNUP ==========")
    print(body)

    email = body.email.lower()

    existing = db.query(User).filter(User.email == email).first()
    if existing and existing.verified:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    print("Password hashed")

    if existing:
        existing.name = body.name
        existing.hashed_password = hashed
        db.commit()
    else:
        user = User(name=body.name, email=email, hashed_password=hashed, verified=False)
        db.add(user)
        db.commit()

    otp = generate_otp()
    print("Generated OTP:", otp)

    # ← CHANGED: store in Redis instead of OTP_STORE dict
    store_otp(email, otp)

    try:
        print("Sending email...")
        send_otp_email(email, otp, body.name)
        print("Email sent successfully")
    except Exception as e:
        print("EMAIL ERROR:", str(e))
        raise

    return {"message": "OTP sent successfully"}


@router.post("/verify-otp")
def verify_otp(body: VerifyOTPRequest, db: Session = Depends(get_db)):
    email = body.email.lower()

    # ← CHANGED: get OTP from Redis instead of OTP_STORE dict
    stored_otp = get_otp(email)

    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please sign up again.")

    if body.otp != stored_otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found. Please sign up first.")

    user.verified = True
    db.commit()

    # ← CHANGED: delete from Redis instead of OTP_STORE dict
    delete_otp(email)

    token = create_jwt(email, user.name)

    print("===== DEBUG =====")
    print("Email:", email)
    print("Name:", user.name)
    print("Token:", token)
    print("=================")

    return {
        "token": token,
        "user": {
            "name": user.name,
            "email": email,
            "initial": user.name[0].upper(),
        },
    }


@router.post("/signin")
def signin(body: SigninRequest, db: Session = Depends(get_db)):
    email = body.email.lower()

    user = db.query(User).filter(User.email == email, User.verified == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not bcrypt.checkpw(body.password.encode(), user.hashed_password.encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_jwt(email, user.name)

    return {
        "token": token,
        "user": {
            "name": user.name,
            "email": email,
            "initial": user.name[0].upper(),
        },
    }


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return current_user