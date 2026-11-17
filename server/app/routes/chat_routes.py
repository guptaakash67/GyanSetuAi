"""
Chat & Wisdom Search routes:
  POST /wisdom/search          -> semantic search across scriptures
  POST /chat/:tradition        -> RAG-powered chat about a tradition
  POST /chat/scripture/:id     -> RAG-powered chat about specific scripture
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from app.config import SCRIPTURES, RUNTIME_CONFIG
from app.ai.rag_pipeline import ask_wisdom, search_scriptures
from app.core.database import get_db
from app.routes.auth_routes import get_current_user
from app.models.models import ChatLog, Insight, Milestone
from sqlalchemy.orm import Session

router = APIRouter(tags=["chat & wisdom"])
security = HTTPBearer(auto_error=False)
VALID_TRADITIONS = {scripture["tradition"] for scripture in SCRIPTURES}
SEARCH_RESULTS_K = RUNTIME_CONFIG["ai"]["search_results_k"]


# ── Schemas ──────────────────────────────────────────────────────────────────
class WisdomSearchRequest(BaseModel):
    query: str
    tradition: Optional[str] = None  # filter by tradition if provided

class ChatRequest(BaseModel):
    message: str
    tradition: Optional[str] = None


def _persist_chat_and_insight(
    db: Session,
    email: str,
    tradition: str,
    message: str,
    answer: str,
    sources: list[dict],
) -> None:
    source_titles = [
        source["title"]
        for source in sources
        if isinstance(source, dict) and source.get("title")
    ]
    source_label = ", ".join(source_titles) or f"{tradition.title()} scriptures"
    insight_title = source_titles[0] if source_titles else f"{tradition.title()} reflection"

    db.add_all([
        ChatLog(user_email=email, tradition=tradition, message=message),
        Insight(
            user_email=email,
            source=source_label,
            title=insight_title,
            quote=answer,
            tradition=tradition,
        ),
    ])

    try:
        db.flush()
        chat_count = db.query(ChatLog).filter(ChatLog.user_email == email).count()
        insight_count = db.query(Insight).filter(Insight.user_email == email).count()
        milestone_labels = []
        if chat_count:
            milestone_labels.append("First Chat")
        if chat_count >= 10:
            milestone_labels.append("10 Chats Completed")
        if insight_count:
            milestone_labels.append("First Insight Saved")
        if insight_count >= 10:
            milestone_labels.append("10 Insights Saved")
        if insight_count >= 25:
            milestone_labels.append("25 Insights Saved")

        existing_labels = {
            milestone.label
            for milestone in db.query(Milestone)
            .filter(
                Milestone.user_email == email,
                Milestone.label.in_(milestone_labels),
            )
            .all()
        }
        db.add_all(
            Milestone(user_email=email, label=label)
            for label in milestone_labels
            if label not in existing_labels
        )
        db.commit()
    except Exception:
        db.rollback()
        raise


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/wisdom/search")
def wisdom_search(body: WisdomSearchRequest):
    """
    Semantic search — finds relevant scriptures for a life challenge.
    Public endpoint — no auth required.
    """
    if not body.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        results = search_scriptures(
            query=body.query,
            tradition=body.tradition,
            k=SEARCH_RESULTS_K,
        )
        return {"results": results, "query": body.query}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed. Please try again.")


@router.post("/chat/{tradition}")
def chat_with_tradition(
    tradition: str,
    body: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    RAG chat about a specific tradition (e.g. /chat/hindu).
    Protected — requires JWT.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = get_current_user(credentials)

    if tradition not in VALID_TRADITIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tradition. Choose from: {', '.join(sorted(VALID_TRADITIONS))}"
        )

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        result = ask_wisdom(
            question=body.message,
            tradition=tradition
        )
        _persist_chat_and_insight(
            db=db,
            email=user["email"],
            tradition=tradition,
            message=body.message,
            answer=result["answer"],
            sources=result["sources"],
        )
        return {
            "role": "assistant",
            "content": result["answer"],
            "sources": result["sources"],
            "insightSaved": True,
        }
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat failed. Please try again.")


@router.post("/chat/scripture/{scripture_id}")
def chat_with_scripture(
    scripture_id: str,
    body: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """
    RAG chat about a specific scripture (e.g. /chat/scripture/bg-2-47).
    Protected — requires JWT.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = get_current_user(credentials)

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # Use tradition from scripture_id prefix if available
        tradition = body.tradition
        result = ask_wisdom(
            question=body.message,
            tradition=tradition
        )
        _persist_chat_and_insight(
            db=db,
            email=user["email"],
            tradition=tradition or "general",
            message=body.message,
            answer=result["answer"],
            sources=result["sources"],
        )
        return {
            "role": "assistant",
            "content": result["answer"],
            "sources": result["sources"],
            "insightSaved": True,
        }
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        db.rollback()
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat failed. Please try again.")