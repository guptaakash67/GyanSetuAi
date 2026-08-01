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
import jwt
import bcrypt
from redis_client import redis_client


router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

# ── Config (set these in your .env) ─────────────────────────────────────────
JWT_SECRET = "6a76f0cfa0e26e4185a036a69f6fba56bb9103a656a334a1334ae6bca90dcede"
JWT_EXPIRE_DAYS = 7

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = "noreplygyansetu@gmail.com"
SMTP_PASSWORD = "lxux kdnc aowh eulv" # Gmail App Password (not your Gmail password)

# ── In-memory stores (replace with DB once you set it up) ───────────────────
# { email: { name, hashed_password, verified } }
USERS = {}
# { email: { otp, expires_at } }
OTP_STORE = {}


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


def send_otp_email(to_email: str, otp: str, name: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="Email service not configured. Set SMTP_EMAIL and SMTP_APP_PASSWORD in .env")

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
        <p style="color:#94a3b8;font-size:13px;margin:20px 0 0;">This code expires in 60 seconds.</p>
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
    print("JWT_SECRET =", JWT_SECRET)

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

# for testing/debugging purposes, you can view the current OTP_STORE and USERS
@router.get("/debug")
def debug():
    return {
        "otp_store": {k: {"otp": v["otp"]} for k, v in OTP_STORE.items()},
        "users": list(USERS.keys())
    }

# ── Routes ───────────────────────────────────────────────────────────────────
@router.post("/signup")
def signup(body: SignupRequest):
    print("========== SIGNUP ==========")
    print(body)

    email = body.email.lower()

    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    print("Password hashed")

    USERS[email] = {
        "name": body.name,
        "hashed_password": hashed,
        "verified": False,
    }

    otp = generate_otp()
    print("Generated OTP:", otp)

    OTP_STORE[email] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
    }

    print("OTP stored")

    try:
        print("Sending email...")
        send_otp_email(email, otp, body.name)
        print("Email sent successfully")
    except Exception as e:
        print("EMAIL ERROR:", str(e))
        raise

    return {"message": "OTP sent successfully"}

@router.post("/verify-otp")
def verify_otp(body: VerifyOTPRequest):
    email = body.email.lower()

    if email not in OTP_STORE:
        raise HTTPException(status_code=400, detail="No OTP found. Please sign up first.")

    record = OTP_STORE[email]

    if datetime.utcnow() > record["expires_at"]:
        del OTP_STORE[email]
        raise HTTPException(status_code=400, detail="OTP expired. Please sign up again.")

    if body.otp != record["otp"]:
        raise HTTPException(status_code=400, detail="Incorrect OTP.")

    # Mark user as verified
    USERS[email]["verified"] = True
    del OTP_STORE[email]

    name = USERS[email]["name"]
    token = create_jwt(email, name)

    print("===== DEBUG =====")
    print("Email:", email)
    print("Name:", name)
    print("Token:", token)
    print("=================")

    return {
        "token": token,
        "user": {
            "name": name,
            "email": email,
            "initial": name[0].upper(),
        },
    }


@router.post("/signin")
def signin(body: SigninRequest):
    email = body.email.lower()

    if email not in USERS or not USERS[email]["verified"]:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = USERS[email]
    if not bcrypt.checkpw(body.password.encode(), user["hashed_password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_jwt(email, user["name"])

    return {
        "token": token,
        "user": {
            "name": user["name"],
            "email": email,
            "initial": user["name"][0].upper(),
        },
    }


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return current_user