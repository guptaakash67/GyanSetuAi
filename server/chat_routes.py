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
from rag_pipeline import ask_wisdom, search_scriptures
from auth_routes import get_current_user

router = APIRouter(tags=["chat & wisdom"])
security = HTTPBearer(auto_error=False)


# ── Schemas ──────────────────────────────────────────────────────────────────
class WisdomSearchRequest(BaseModel):
    query: str
    tradition: Optional[str] = None  # filter by tradition if provided

class ChatRequest(BaseModel):
    message: str
    tradition: Optional[str] = None


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
            k=6
        )
        return {"results": results, "query": body.query}
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed. Please try again.")


@router.post("/chat/{tradition}")
def chat_with_tradition(
    tradition: str,
    body: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    RAG chat about a specific tradition (e.g. /chat/hindu).
    Protected — requires JWT.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    get_current_user(credentials)  # validate JWT

    valid_traditions = ["hindu", "buddhism", "taoism", "christian", "islamic"]
    if tradition not in valid_traditions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tradition. Choose from: {', '.join(valid_traditions)}"
        )

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        result = ask_wisdom(
            question=body.message,
            tradition=tradition
        )
        return {
            "role": "assistant",
            "content": result["answer"],
            "sources": result["sources"],
        }
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat failed. Please try again.")


@router.post("/chat/scripture/{scripture_id}")
def chat_with_scripture(
    scripture_id: str,
    body: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    RAG chat about a specific scripture (e.g. /chat/scripture/bg-2-47).
    Protected — requires JWT.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    get_current_user(credentials)  # validate JWT

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # Use tradition from scripture_id prefix if available
        tradition = body.tradition
        result = ask_wisdom(
            question=body.message,
            tradition=tradition
        )
        return {
            "role": "assistant",
            "content": result["answer"],
            "sources": result["sources"],
        }
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat failed. Please try again.")