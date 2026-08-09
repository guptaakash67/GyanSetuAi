# GyanSetu 🕉️

> Ancient Wisdom for Modern Life — A full-stack spiritual guidance platform with AI-powered scripture chat, multi-faith library, and personalized journey tracking.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat&logo=postgresql)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=flat&logo=redis)](https://upstash.com/)

---

## Screenshots

| Home | Scripture Library | My Journey |
|------|------------------|------------|
| ![Home](./screenshots/home.png) | ![Library](./screenshots/library.png) | ![Journey](./screenshots/journey.png) |

---

## Tech Stack

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router v6
- Axios

**Backend**
- FastAPI (Python)
- PostgreSQL via Neon (users, auth)
- Redis via Upstash (OTP storage)
- JWT authentication
- SMTP via Gmail (OTP emails)

---

## Features

- 🔐 Email + Password auth with OTP email verification
- 📚 Multi-faith Scripture Library (Hindu, Buddhism, Taoism, Christianity, Islam)
- 🤖 AI-powered scripture chat
- 🗺️ Personal spiritual journey tracking
- 📖 Wisdom Guide — search by life challenge
- 🔒 Protected routes with JWT
- 📱 Mobile responsive with sidebar navigation

---

## Project Structure

```
GyanSetu/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Navbar, BackBar, Icons, ProtectedRoute
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # useFetch
│   │   ├── lib/             # axios api client
│   │   └── pages/           # Home, Library, WisdomGuide, Journey, SignIn, SignUp
│   ├── .env                 # VITE_API_URL
│   └── package.json
└── server/                  # FastAPI backend
    ├── main.py              # app entry, routes
    ├── auth_routes.py       # signup, verify-otp, signin, me
    ├── database.py          # SQLAlchemy + Neon setup
    ├── models.py            # User model
    ├── redis_client.py      # Upstash Redis OTP client
    ├── library.json         # scripture data
    ├── requirements.txt
    └── .env                 # secrets
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- [Neon](https://neon.tech) PostgreSQL database
- [Upstash](https://upstash.com) Redis database
- Gmail account with [App Password](https://myaccount.google.com/apppasswords) enabled

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/GyanSetu.git
cd GyanSetu
```

### 2. Backend setup

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `server/.env`:

```env
JWT_SECRET=your-long-random-secret-key
SMTP_EMAIL=your@gmail.com
SMTP_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
REDIS_URL=rediss://default:password@host:6379
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
✅ Database tables created successfully
✅ Redis connected successfully
```

### 3. Frontend setup

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register + send OTP |
| POST | `/auth/verify-otp` | Verify OTP → returns JWT |
| POST | `/auth/signin` | Login → returns JWT |
| GET | `/auth/me` | Get current user |

### Library
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/library/traditions` | All traditions |
| GET | `/library/traditions/:slug` | Single tradition |
| GET | `/library/traditions/:slug/texts` | Texts for a tradition |
| GET | `/library/stats` | Library statistics |

---

## Environment Variables

### Frontend (`client/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL |

### Backend (`server/.env`)
| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT signing |
| `SMTP_EMAIL` | Gmail address for OTP emails |
| `SMTP_APP_PASSWORD` | Gmail App Password |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `REDIS_URL` | Upstash Redis connection string |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

**Commit message format:**
```
feat: add new feature
fix: bug fix
docs: documentation update
refactor: code refactor
```

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/yourusername">Akash Gupta</a>
</div>
