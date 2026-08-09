import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import init_db
from redis_client import test_connection
from auth_routes import router as auth_router

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()        # creates PostgreSQL tables
    test_connection() # tests Redis connection

app.include_router(auth_router)

data = json.loads(Path("library.json").read_text(encoding="utf-8"))
TRADITIONS = data["traditions"]
TRADITION_TEXTS = data["texts"]

@app.get("/")
def root():
    return {"message": "GyanSetu API is running!"}

@app.get("/library/traditions")
def list_traditions():
    return TRADITIONS

@app.get("/library/stats")
def library_stats():
    total_texts = sum(t["textCount"] for t in TRADITIONS)
    return {"sacredTexts": total_texts, "traditions": len(TRADITIONS), "yearsOfWisdom": 5000}

@app.get("/library/traditions/{slug}")
def get_tradition(slug: str):
    tradition = next((t for t in TRADITIONS if t["slug"] == slug), None)
    if tradition is None:
        raise HTTPException(status_code=404, detail=f"Tradition '{slug}' not found")
    return tradition

@app.get("/library/traditions/{slug}/texts")
def get_tradition_texts(slug: str):
    tradition = next((t for t in TRADITIONS if t["slug"] == slug), None)
    if tradition is None:
        raise HTTPException(status_code=404, detail=f"Tradition '{slug}' not found")
    return TRADITION_TEXTS.get(slug, [])