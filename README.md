# GyanSetu

A full-stack spiritual guidance platform that enables AI-powered conversations with sacred scriptures using Retrieval Augmented Generation (RAG).

---

## Overview

GyanSetu helps users explore scriptures from multiple world traditions and interact with them through a context-aware AI chat. The platform uses semantic search to find relevant passages and grounds LLM responses in scripture content rather than generic knowledge.

---

## Tech Stack

### Frontend
- React 18
- Vite
- React Router
- Axios
- CSS modules / custom styling

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis
- JWT + bcrypt
- LangChain
- LLM: Groq with ChatGroq (LLaMA 3.1 / configured via `GROQ_MODEL`)
- Vector DB: Pinecone
- Embeddings: Hugging Face sentence-transformers
- Gmail SMTP

---

## Project Structure

```text
GyanSetu/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── server/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── ingest.py
│   │   │   └── rag_pipeline.py
│   │   ├── config.py
│   │   ├── core/
│   │   │   ├── database.py
│   │   │   └── redis_client.py
│   │   ├── main.py
│   │   ├── models/
│   │   │   └── models.py
│   │   └── routes/
│   │       ├── auth_routes.py
│   │       ├── chat_routes.py
│   │       └── journey_routes.py
│   ├── data/
│   │   ├── Library.json
│   │   ├── runtime_config.json
│   │   └── scriptures.json
│   ├── .env
│   ├── core/
│   │   ├── database.py
│   │   └── redis_client.py
│   ├── data/
│   │   └── Library.json
│   ├── .env
│   ├── main.py
│   ├── requirements.txt
│   └── venv/
├── .gitignore
├── skills-lock.json
└── README.md
```

---

## Current Architecture Notes

- The FastAPI application, routes, models, and infrastructure live under the `server/app` package.
- The application models are consolidated into a single model file: `server/app/models/models.py`.
- Startup and imports are aligned with the real package layout.
- AI defaults and application content are stored in JSON data files; credentials and deployment-specific values remain in environment variables.
- The backend uses a single canonical `core` package for database and Redis utilities.
- The application models are consolidated into a single model file: `server/app/models/models.py`.
- Startup and imports are aligned with the real package layout.
- AI functionality is configured through environment variables, not hardcoded values.

---

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL database
- Redis instance
- Groq API key
- Pinecone API key and index
- Gmail account with app password configured

---

## Setup

### Test Deployment (Render)

The root `render.yaml` defines a test deployment for the FastAPI backend, with
Render-managed PostgreSQL and Key Value services. In Render, create a new Blueprint
from this GitHub repository and provide `GROQ_API_KEY`, `PINECONE_API_KEY`,
`SMTP_EMAIL`, and `SMTP_APP_PASSWORD` when prompted. Render generates `JWT_SECRET`
and connects the database and Redis-compatible Key Value service automatically.

The Blueprint uses Render's free plans for testing. Free web services can sleep when
idle, free Key Value has limited capacity, and free PostgreSQL expires after 30 days;
do not use these plans for production or persistent user data.

After deploying the frontend, update the backend's `CORS_ORIGINS` environment variable
in Render to the exact frontend origin (for example, `https://your-app.vercel.app`).
Separate multiple origins with commas. The API health check is available at `/`.

### Backend

```bash
cd server
python -m venv venv
venv\Scripts\activate      # Windows
# or: source venv/bin/activate
pip install -r requirements.txt
```

Create `server/.env` with values like:

```env
JWT_SECRET=your-secret
SMTP_EMAIL=noreplygyansetu@gmail.com
SMTP_APP_PASSWORD=your-gmail-app-password
DATABASE_URL=postgresql://... 
REDIS_URL=rediss://...
GROQ_API_KEY=your-groq-key
GROQ_MODEL=openai/gpt-oss-20b
GROQ_MODEL=llama-3.1-8b-instant
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX=gyanSetu
```

The server reads non-secret defaults from `server/data/runtime_config.json`.
Keep credentials such as `JWT_SECRET`, `SMTP_APP_PASSWORD`, `GROQ_API_KEY`, and
`PINECONE_API_KEY` in the ignored `.env` file, never in JSON or source code.

Initialize the database tables:

```bash
python -c "import app.main; print('startup-ok')"
```

The RAG knowledge base includes the curated verses in `server/data/scriptures.json`
and the scraped passages in `server/data/gyansetu_cleaned_v1.csv`. After changing
either dataset, rebuild the Pinecone vectors from the `server` directory:

```bash
python -m app.ai.ingest
Initialize the database tables:

```bash
python -c "import main; print('startup-ok')"
```

Start the backend server:

```bash
python -m uvicorn app.main:app --reload --port 8000
python -m uvicorn main:app --reload --port 8000
```

If running from the project root instead of the server folder:

```bash
python -m uvicorn app.main:app --app-dir server --reload --port 8000
python -m uvicorn main:app --app-dir server --reload --port 8000
```

### Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

---

## AI / RAG Pipeline

The app uses a retrieval-based pipeline powered by an LLM:

```text
User question
  -> semantic search in Pinecone
  -> top scripture passages retrieved
  -> context + prompt assembled in LangChain LCEL
  -> Groq LLM generates a grounded answer
  -> answer + source metadata returned to client
```

Current implementation uses:
- `sentence-transformers/all-MiniLM-L6-v2` for embeddings
- Pinecone vector search for scripture retrieval
- Groq `ChatGroq` as the LLM layer for response generation
- LangChain LCEL to orchestrate retrieval + prompting + generation
- Curated and scraped scripture passages embedded into Pinecone as grounded answer context

---

## API Reference

### Authentication

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| POST | `/auth/signup` | No | Register and send OTP |
| POST | `/auth/verify-otp` | No | Verify OTP and receive JWT |
| POST | `/auth/signin` | No | Login and receive JWT |
| GET | `/auth/me` | Yes | Get current user |

### Library

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| GET | `/library/traditions` | No | List traditions |
| GET | `/library/traditions/{slug}` | No | Get tradition details |
| GET | `/library/traditions/{slug}/texts` | No | Get scripture texts for a tradition |
| GET | `/library/stats` | No | Library statistics |

### Chat and Search

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| POST | `/wisdom/search` | No | Search scriptures semantically |
| POST | `/chat/{tradition}` | Yes | RAG chat by tradition |
| POST | `/chat/scripture/{id}` | Yes | RAG chat for a specific scripture |

---

## Important Notes

- The backend uses `server/app/main.py` as its ASGI entry point and keeps routes, models, and infrastructure in the `server/app` package.
- The app is now using the cleaned project structure with a single `server/core` package and a single model file.
- Groq and Pinecone must be configured with valid keys and resources tied to the same provider account.
- If the backend fails at startup, check:
  1. the Python environment
  2. the `server/.env` values
  3. the Groq model name and Pinecone index validity

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit with a clear message
4. Open a pull request

Suggested commit prefixes:
- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `chore:`

---

## License

MIT
