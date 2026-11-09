import hmac
import os
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.config import RUNTIME_CONFIG

router = APIRouter(prefix="/internal", tags=["internal"])
RUNTIME_EMBEDDING_DIMENSION = RUNTIME_CONFIG["ai"]["embedding_dimension"]


class EmbeddingRequest(BaseModel):
    texts: list[Annotated[str, Field(min_length=1, max_length=4096)]] = Field(
        min_length=1,
        max_length=32,
    )


@router.post("/embeddings")
def create_embeddings(
    body: EmbeddingRequest,
    authorization: str | None = Header(default=None),
):
    configured_token = os.getenv("EMBEDDING_SERVICE_TOKEN")
    if not configured_token:
        raise HTTPException(
            status_code=503,
            detail="Embedding service is not configured.",
        )

    scheme, separator, supplied_token = (authorization or "").partition(" ")
    if (
        not separator
        or scheme.lower() != "bearer"
        or not hmac.compare_digest(supplied_token, configured_token)
    ):
        raise HTTPException(status_code=401, detail="Invalid embedding service token.")

    provider = os.getenv("EMBEDDING_PROVIDER", "local").strip().lower()
    if provider != "local":
        raise HTTPException(
            status_code=503,
            detail="This deployment is not configured to serve local embeddings.",
        )

    from app.ai.rag_pipeline import get_local_embeddings

    embeddings = get_local_embeddings().embed_documents(body.texts)
    expected_dimension = RUNTIME_EMBEDDING_DIMENSION
    if len(embeddings) != len(body.texts) or any(
        len(vector) != expected_dimension for vector in embeddings
    ):
        raise HTTPException(
            status_code=502,
            detail="Embedding model returned an unexpected result shape.",
        )

    return {"embeddings": embeddings}
