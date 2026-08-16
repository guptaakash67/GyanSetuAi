# GyanSetu

A full-stack spiritual guidance platform that enables AI-powered conversations with sacred scriptures using Retrieval Augmented Generation (RAG).

---

## Overview

GyanSetu allows users to explore scriptures from 6 world traditions and interact with them through a context-aware AI chat. The platform uses semantic search to find relevant passages and grounds LLM responses in actual scripture content.

---

## Tech Stack

**Frontend**
- React 18, Vite, Tailwind CSS, React Router v6, Axios

**Backend**
- FastAPI, LangChain 1.x (LCEL), Groq (LLaMA 3.1), Pinecone, Neon PostgreSQL, Upstash Redis, JWT, bcrypt, Gmail SMTP

---

## Project Structure

```
GyanSetu/
├── client/
│   ├── src/
│   │   ├── components/        # Navbar, BackBar, Icons, ProtectedRoute
│   │   ├── context/           # AuthContext
│   │   ├── hooks/             # useFetch
│   │   ├── lib/               # Axios client and API endpoints
│   │   └── pages/             # Home, Library, ScriptureChat, WisdomGuide, Journey, SignIn, SignUp
│   ├── .env
│   └── package.json
└── server/
    ├── main.py                # Application entry point
    ├── auth_routes.py         # Authentication endpoints
    ├── chat_routes.py         # RAG chat and wisdom search
    ├── rag_pipeline.py        # LangChain LCEL pipeline
    ├── database.py            # PostgreSQL connection
    ├── models.py              # SQLAlchemy models
    ├── redis_client.py        # Redis OTP client
    ├── ingest.py              # Scripture embedding script
    ├── library.json           # Scripture data
    └── requirements.txt
```

---

## Prerequisites

- Node.js 18+
- Python 3.11+
- Neon PostgreSQL database
- Upstash Redis database
- Pinecone vector database
- Groq API key
- Gmail account with App Password enabled

---

## Setup

### Backend

```bash
cd server
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

Create `server/.env`:

```
JWT_SECRET=
SMTP_EMAIL=
SMTP_APP_PASSWORD=
DATABASE_URL=
REDIS_URL=
GROQ_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=
```

Embed scriptures into Pinecone (run once):

```bash
python ingest.py
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

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
| GET | `/library/traditions` | No | List all traditions |
| GET | `/library/traditions/:slug` | No | Get single tradition |
| GET | `/library/traditions/:slug/texts` | No | Get texts for a tradition |
| GET | `/library/stats` | No | Library statistics |

### Chat and Search

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| POST | `/wisdom/search` | No | Semantic search across scriptures |
| POST | `/chat/:tradition` | Yes | RAG chat filtered by tradition |
| POST | `/chat/scripture/:id` | Yes | RAG chat for a specific scripture |

---

## RAG Pipeline

```
User input
    -> Converted to vector using sentence-transformers
    -> Pinecone retrieves 4 most similar scripture passages
    -> LangChain LCEL builds prompt with context and question
    -> Groq LLaMA 3.1 generates response
    -> Answer and source citations returned to client
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/name`
3. Commit your changes: `git commit -m "feat: description"`
4. Push to the branch: `git push origin feature/name`
5. Open a pull request

Commit convention: `feat`, `fix`, `docs`, `refactor`, `chore`

---

## License

MIT
