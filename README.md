<div align="center">

# 🎯 Impossible Tasks tiktok style 
idea from x

**A TikTok-style feed of tasks designed to be nearly impossible to complete.**

Swipe through 38 precision challenges — reaction tests, memory games, rhythm tasks, brain teasers, and more. Each task tracks your attempts, completion rate, and streaks across all players globally.

[**Live Demo**](https://tiktoktaskss.vercel.app) · [**Report a Bug**](https://github.com/Boweii22/tiktoktaskss/issues) · [**Suggest a Task**](https://github.com/Boweii22/tiktoktaskss/issues)

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)

</div>

---

## What is this?

Impossible Tasks is a mobile-first web app that serves up bite-sized challenges in a TikTok-style swipe feed. Think you have good reaction time? Steady hands? A sharp memory? These tasks will humble you.

Every task is tracked globally — you can see exactly how many people have attempted it and what percentage actually pulled it off.

---

## Task List (38 total)

| # | Name | What makes it hard |
|---|------|-------------------|
| 1 | **Hold** | Hold for exactly 3.000s — tolerance ±15ms |
| 2 | **Still** | Tap the split-second the circle freezes |
| 3 | **Catch** | Drag a dot into a shrinking circle |
| 4 | **Tap 50** | 50 taps — but one is a hidden trap |
| 5 | **Balance** | Keep a block centered for 5 seconds |
| 6 | **Read** | Instructions lie to you |
| 7 | **Wait** | Tap only when the button appears |
| 8 | **Sync** | Tap only when two shapes overlap exactly |
| 9 | **React** | Go green → tap in under 0.2s |
| 10 | **Quick** | Tap within 0.35s of start |
| 11 | **Exact** | Slide to exactly 73 — tolerance ±0.4 |
| 12 | **Speed** | Tap exactly 12 times in 2 seconds |
| 13 | **Color Stop** | Tap when a shifting color looks stopped |
| 14 | **Vibration** | Release when vibration stops (it fakes you out) |
| 15 | **Center** | Tap the true mathematical center — no guides |
| 16 | **Don't Blink** | Tap at the exact moment a button peaks |
| 17 | **Swipe Up** | Swipe perfectly vertical — tight angle tolerance |
| 18 | **One Tap** | One tap allowed — nothing tells you when |
| 19 | **Literal** | Follow the instruction literally |
| 20 | **Nothing** | Tap when nothing happens — one correct moment |
| 21 | **Stop at Zero** | Stop a timer exactly at 0 |
| 22 | **Finger Still** | Hold still — microscopic jitter fails |
| 23 | **No Edge** | Drag without hitting invisible walls |
| 24 | **Rhythm** | Reproduce a silent visual rhythm |
| 25 | **Wait Longer** | Wait longer than feels right |
| 26 | **Odd Frame** | Spot 1 different frame out of 80 identical ones |
| 27 | **Don't React** | Fake GO appears — don't tap |
| 28 | **Slow Swipe** | Swipe in a narrow speed window |
| 29 | **Same Spot** | Second tap must land on the exact same pixel |
| 30 | **Zero Score** | Every tap adds to score — end at zero |
| 31 | **Mirror** | Swipe the opposite direction to the arrow |
| 32 | **Ghost Dot** | Dot flashes for <1s — tap where it was |
| 33 | **Simon** | Reproduce a 4-color flash sequence |
| 34 | **Flash Count** | Count how many times a dot flashes (5–13) |
| 35 | **2-Second Gap** | Two taps exactly 2.0s apart — no clock |
| 36 | **Find Order** | Tap 1–7 in order — one number is microscopic |
| 37 | **Stroop** | Tap the ink color, not the word it spells |
| 38 | **Silent Beat** | Tap the 4th beat of a rhythm that stopped |

---

## Features

- **TikTok-style feed** — swipe up/down between tasks
- **Global stats** — live attempt counts and completion rates per task
- **Streaks** — daily streak tracking with a fire badge
- **Profiles** — create a username, set a bio, view your completions
- **Leaderboard** — top players by completions, streak, and followers
- **Bookmarks** — save tasks to your profile
- **Share** — native share sheet with copy link, copy text, and Twitter
- **Search** — find and follow other players
- **Community tasks** — submit your own task idea
- **Bottom nav** — mobile-first navigation (Home, Leaderboard, Search, Profile)
- **Offline mode** — works without a backend, with fallback task data

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Framer Motion, Tailwind CSS, Lucide Icons |
| Backend | FastAPI (Python), Uvicorn |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Running Locally

### 1. Clone

```bash
git clone https://github.com/Boweii22/tiktoktaskss.git
cd tiktoktaskss
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

Start the server:

```bash
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

> No Supabase? The backend still starts and returns fallback data — perfect for local testing.

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

Start:

```bash
npm start
```

Open **http://localhost:3000**

---

## Deploying

### Frontend → Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import repo
2. Set **Root Directory** to `frontend`
3. Add env var: `REACT_APP_BACKEND_URL` = your backend URL
4. Deploy

### Backend → Render

1. [render.com](https://render.com) → **New Web Service** → import repo
2. **Root Directory:** `backend`
3. **Build:** `pip install -r requirements.txt`
4. **Start:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CORS_ORIGINS` (your Vercel URL)

### Database → Supabase

1. [supabase.com](https://supabase.com) → new project
2. SQL Editor → run these in order:
   - `backend/supabase_schema.sql`
   - `backend/supabase_profiles.sql` *(if it exists)*
   - `backend/supabase_bookmarks.sql`
   - `backend/supabase_notifications.sql`

---

## License

MIT — do whatever you want with it.
