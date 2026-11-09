from contextlib import asynccontextmanager
import logging
import os
from collections.abc import AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import LIBRARY_DATA, RUNTIME_CONFIG
from app.core.database import init_db
from app.core.redis_client import test_connection
from app.routes.auth_routes import router as auth_router
from app.routes.chat_routes import router as chat_router
from app.routes.journey_routes import router as journey_router

logger = logging.getLogger(__name__)

TRADITIONS = LIBRARY_DATA.get("traditions", [])
TRADITION_TEXTS = LIBRARY_DATA.get("texts", {})
APP_CONFIG = RUNTIME_CONFIG["app"]
configured_origins = os.getenv("CORS_ORIGINS")
if configured_origins:
    cors_origins = [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]
else:
    cors_origins = APP_CONFIG["cors_origins"]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    test_connection()
    logger.info("GyanSetu API startup completed")
    yield


app = FastAPI(
    title=APP_CONFIG["name"],
    version=APP_CONFIG["version"],
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(journey_router)


@app.get("/")
def root():
    return {"message": "GyanSetu API is running!"}


@app.get("/library/traditions")
def list_traditions():
    return [
        {
            **tradition,
            "textTitles": [
                text["title"] for text in TRADITION_TEXTS.get(tradition["slug"], [])
            ],
        }
        for tradition in TRADITIONS
    ]


@app.get("/library/stats")
def library_stats():
    total_texts = sum(tradition["textCount"] for tradition in TRADITIONS)
    return {
        "sacredTexts": total_texts,
        "traditions": len(TRADITIONS),
        "yearsOfWisdom": APP_CONFIG["years_of_wisdom"],
    }


@app.get("/library/traditions/{slug}")
def get_tradition(slug: str):
    tradition = next(
        (item for item in TRADITIONS if item["slug"] == slug),
        None,
    )
    if tradition is None:
        raise HTTPException(status_code=404, detail=f"Tradition '{slug}' not found")
    return tradition


@app.get("/library/traditions/{slug}/texts")
def get_tradition_texts(slug: str):
    tradition = next(
        (item for item in TRADITIONS if item["slug"] == slug),
        None,
    )
    if tradition is None:
        raise HTTPException(status_code=404, detail=f"Tradition '{slug}' not found")
    return TRADITION_TEXTS.get(slug, [])
