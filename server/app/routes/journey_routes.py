from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from core.database import get_db
from app.models.models import User, Insight, Milestone, ChatLog
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/journey", tags=["journey"])
security = HTTPBearer()


# ── Schemas ───────────────────────────────────────────────────────────────────
class SaveInsightRequest(BaseModel):
    source: str
    title: str
    quote: str
    note: Optional[str] = None
    tradition: str

class UpdateNoteRequest(BaseModel):
    note: str


# ── Helpers ───────────────────────────────────────────────────────────────────
def get_user_email(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = get_current_user(credentials)
    return user["email"]


def check_and_award_milestone(email: str, label: str, db: Session):
    """Award a milestone if not already achieved."""
    exists = db.query(Milestone).filter(
        Milestone.user_email == email,
        Milestone.label == label
    ).first()
    if not exists:
        milestone = Milestone(user_email=email, label=label)
        db.add(milestone)
        db.commit()


def calculate_growth_score(email: str, db: Session) -> int:
    """
    Growth score out of 100:
    - Insights saved: up to 40 points (1 point per insight, max 40)
    - Weeks active: up to 30 points (5 points per week, max 30)
    - Chats done: up to 30 points (1 point per chat, max 30)
    """
    insights_count = db.query(Insight).filter(Insight.user_email == email).count()
    chats_count = db.query(ChatLog).filter(ChatLog.user_email == email).count()

    # Calculate weeks active from first activity
    user = db.query(User).filter(User.email == email).first()
    weeks_active = 0
    if user and user.created_at:
        delta = datetime.utcnow() - user.created_at
        weeks_active = delta.days // 7

    insights_score = min(insights_count, 40)
    weeks_score = min(weeks_active * 5, 30)
    chats_score = min(chats_count, 30)

    return insights_score + weeks_score + chats_score


# ── Routes ────────────────────────────────────────────────────────────────────
@router.get("/summary")
def get_summary(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    email = get_user_email(credentials)

    insights_count = db.query(Insight).filter(Insight.user_email == email).count()
    user = db.query(User).filter(User.email == email).first()

    weeks_active = 0
    if user and user.created_at:
        delta = datetime.utcnow() - user.created_at
        weeks_active = max(1, delta.days // 7)

    growth_score = calculate_growth_score(email, db)

    return {
        "insightsSaved": insights_count,
        "weeksActive": weeks_active,
        "growthScore": growth_score,
    }


@router.get("/milestones")
def get_milestones(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    email = get_user_email(credentials)

    milestones = db.query(Milestone)\
        .filter(Milestone.user_email == email)\
        .order_by(Milestone.achieved_at.asc())\
        .all()

    return [
        {
            "id": str(m.id),
            "label": m.label,
            "date": m.achieved_at.strftime("%b %d"),
        }
        for m in milestones
    ]


@router.get("/insights")
def get_insights(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    email = get_user_email(credentials)

    insights = db.query(Insight)\
        .filter(Insight.user_email == email)\
        .order_by(Insight.saved_at.desc())\
        .all()

    return [
        {
            "id": str(i.id),
            "source": i.source,
            "title": i.title,
            "quote": i.quote,
            "note": i.note,
            "tradition": i.tradition,
            "likes": i.likes,
            "savedAt": _time_ago(i.saved_at),
        }
        for i in insights
    ]


@router.post("/insights")
def save_insight(
    body: SaveInsightRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    email = get_user_email(credentials)

    insight = Insight(
        user_email=email,
        source=body.source,
        title=body.title,
        quote=body.quote,
        note=body.note,
        tradition=body.tradition,
    )
    db.add(insight)
    db.commit()

    # Auto-track milestones
    insights_count = db.query(Insight).filter(Insight.user_email == email).count()

    check_and_award_milestone(email, "First Insight Saved", db)
    if insights_count >= 10:
        check_and_award_milestone(email, "10 Insights Saved", db)
    if insights_count >= 25:
        check_and_award_milestone(email, "25 Insights Saved", db)

    return {"message": "Insight saved", "id": str(insight.id)}


@router.patch("/insights/{insight_id}/note")
def update_note(
    insight_id: str,
    body: UpdateNoteRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    email = get_user_email(credentials)

    insight = db.query(Insight).filter(
        Insight.id == insight_id,
        Insight.user_email == email
    ).first()

    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    insight.note = body.note
    db.commit()

    return {"message": "Note updated"}


@router.delete("/insights/{insight_id}")
def delete_insight(
    insight_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    email = get_user_email(credentials)

    insight = db.query(Insight).filter(
        Insight.id == insight_id,
        Insight.user_email == email
    ).first()

    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    db.delete(insight)
    db.commit()

    return {"message": "Insight deleted"}


@router.post("/chat-log")
def log_chat(
    tradition: str,
    message: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Called after every chat message to track activity."""
    email = get_user_email(credentials)

    log = ChatLog(user_email=email, tradition=tradition, message=message)
    db.add(log)
    db.commit()

    # Award first chat milestone
    check_and_award_milestone(email, "First Chat", db)

    chats_count = db.query(ChatLog).filter(ChatLog.user_email == email).count()
    if chats_count >= 10:
        check_and_award_milestone(email, "10 Chats Completed", db)

    return {"message": "Logged"}


# ── Utility ───────────────────────────────────────────────────────────────────
def _time_ago(dt: datetime) -> str:
    delta = datetime.utcnow() - dt
    if delta.days == 0:
        return "Today"
    elif delta.days == 1:
        return "Yesterday"
    elif delta.days < 7:
        return f"{delta.days} days ago"
    elif delta.days < 14:
        return "1 week ago"
    elif delta.days < 30:
        return f"{delta.days // 7} weeks ago"
    else:
        return f"{delta.days // 30} months ago"