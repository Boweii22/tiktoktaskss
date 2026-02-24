# Impossible Tasks (TikTok-style)

## What was fixed

- **Backend (`server.py`)**  
  - Uses Supabase (PostgreSQL) instead of MongoDB. Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `backend/.env`.  
  - Run `backend/supabase_schema.sql` in Supabase SQL Editor to create tables. If Supabase isn't configured, the backend still starts and returns fallback data.

- **Frontend**  
  - Craco: `dotenv` is loaded only if available so the dev server doesn’t crash when `dotenv` isn’t installed.  
  - API: When `REACT_APP_BACKEND_URL` is unset, all API methods short-circuit correctly (offline mode, no requests to `/api`).

## How to run

### 1. Backend (FastAPI + Supabase)

- **Supabase**: Create a free project at [supabase.com](https://supabase.com). Run `backend/supabase_schema.sql`, then `backend/supabase_profiles.sql`, then `backend/supabase_user_tasks.sql` for profiles and user-created tasks. Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `backend/.env`.  
  If MongoDB isn’t running, the backend still starts; the frontend will use offline fallback tasks when the API fails.

- From the project root:
  ```bash
  cd backend
  pip install -r requirements.txt
  python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
  ```
  **Windows PowerShell (quick start):** from project root run `.\backend\run_backend.ps1` to install deps if needed and start the server.
  API base: **http://localhost:8000** (e.g. http://localhost:8000/api/tasks).

### 2. Frontend (React)

- Ensure `frontend/.env` has:
  ```env
  REACT_APP_BACKEND_URL=http://localhost:8000
  ```

- From the project root:
  ```bash
  cd frontend
  npm install
  npm start
  ```
  If port 3000 is in use, run with another port, e.g.:
  ```bash
  set PORT=3002 && npm start
  ```
  (Windows PowerShell: `$env:PORT=3002; npm start`)

- Open **http://localhost:3000** (or the port shown in the terminal).  
  **Important:** If you change `frontend/.env`, restart `npm start` so React picks up the new `REACT_APP_BACKEND_URL`.

### Troubleshooting: "Offline mode — Backend unreachable"

- **Backend must be running.** Start it first (see Backend step above or `.\backend\run_backend.ps1` on Windows). The frontend calls `http://localhost:8000` by default.
- **Check `frontend/.env`** contains `REACT_APP_BACKEND_URL=http://localhost:8000` (no trailing slash). Restart the frontend after changing `.env`.
- **CORS:** The backend allows localhost and LAN origins on any port. If you use a different backend URL, set `CORS_ORIGINS` in `backend/.env` (e.g. `CORS_ORIGINS=http://localhost:3002,http://127.0.0.1:3002`).

### 3. Optional: run backend tests

From the project root:
```bash
python backend_test.py
```
(Uses a remote base URL by default; you can change it in the script to `http://localhost:8000` for local testing.)

---

## Deploy frontend on Vercel

Only the **frontend** is deployed to Vercel. The backend (FastAPI + Supabase) is deployed on [Render](https://render.com)—see the exact steps below.

### 1. Push your code to GitHub

Make sure the project is in a Git repo and pushed to GitHub (or GitLab/Bitbucket).

### 2. Import the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New…** → **Project**.
3. Import your repository.
4. **Root Directory**: leave as **frontend** (or set to `frontend` if you don’t use the repo’s `vercel.json`). The repo’s `vercel.json` already sets `"rootDirectory": "frontend"`.
5. **Build Command**: `npm run build` (default).
6. **Output Directory**: `build` (default).
7. Under **Environment Variables**, add:
   - **Name:** `REACT_APP_BACKEND_URL`  
   - **Value:** your backend API base URL, e.g. `https://your-backend.up.railway.app` (no trailing slash).  
   Use the same variable for Production, Preview, and Development if you want.
8. Click **Deploy**.

After the build finishes, Vercel will give you a URL (e.g. `https://your-project.vercel.app`). The app will call the backend at `REACT_APP_BACKEND_URL`; if that’s wrong or the backend is down, the frontend will use offline fallback tasks.

### 3. Backend and Supabase

- Host the FastAPI app (e.g. [Render](https://render.com)). In the backend’s environment, set **`CORS_ORIGINS`** to your Vercel URL, e.g. `https://your-project.vercel.app` (or a comma-separated list if you use preview URLs).
- Use [Supabase](https://supabase.com)) and set **`SUPABASE_URL`** in the backend’s environment.

---

## Exact deployment steps (order matters)


### Step 1: Supabase (free database)

1. Go to [supabase.com](https://supabase.com), sign in, create a new project (free tier).
2. In **Project Settings** → **API**, get **Project URL** and **service_role** key. You’ll use the same `SUPABASE_URL` when running the backend locally and when you later deploy the backend (only if the deployed backend can reach your machine, which usually means you need a tunnel or use Atlas).
3. In **SQL Editor**, run `backend/supabase_schema.sql`, then `backend/supabase_profiles.sql` (for profiles). If you already had profiles and want the streak counter, run `backend/supabase_streak_migration.sql` to add streak columns.

4. Use **Table Editor** to view tables. (Remove old MongoDB text below)  
  1. Go to [supabase.com](https://supabase.com), sign in, create a free cluster.  
  2. **Database Access** → Add user (username + password).  
  3. **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere) so Render can connect.  
  4. **Connect** → **Connect your application** → copy the connection string (e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`).  
  5. Replace `<password>` with your DB user password. This is your **`SUPABASE_URL`**. You can add the database name: `...mongodb.net/impossible_tasks?retryWrites=...`.

**MongoDB Compass:** You can use Compass with either local or Atlas. For Atlas, in Compass paste the same connection string you use as `SUPABASE_URL`. For local, use `mongodb://localhost:27017`. Compass is just a client; it doesn’t care whether the app is on Vercel or not.

### Step 2: Deploy the backend on Render

1. Go to [render.com](https://render.com), sign in with GitHub.  
2. **Dashboard** → **New +** → **Web Service**.  
3. Connect your repository (authorize Render if needed). Select the repo.  
4. Configure the service:  
   - **Name:** e.g. `tiktoktasks-api` (any name; this becomes part of the URL).  
   - **Root Directory:** `backend` (so Render uses the `backend` folder).  
   - **Runtime:** Python 3.  
   - **Build Command:** `pip install -r requirements.txt`  
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`  
5. **Environment** (Environment Variables): add  
   - `SUPABASE_URL` = your Supabase project URL (from Step 1).
   - `SUPABASE_SERVICE_KEY` = your Supabase service_role key (from Step 1).  
   - `CORS_ORIGINS` = leave empty for now; you’ll set it in Step 4 after you have the Vercel URL.  
6. Click **Create Web Service**. Render will build and deploy. When it’s live, copy the URL at the top (e.g. `https://tiktoktasks-api.onrender.com`). This is your **backend URL**.

### Step 3: Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com), sign in with GitHub.  
2. **Add New…** → **Project** → import the same repo.  
3. Root Directory: **frontend** (or leave default if `vercel.json` sets it).  
4. **Environment Variables**: add  
   - Name: `REACT_APP_BACKEND_URL`  
   - Value: the backend URL from Step 2 (e.g. `https://tiktoktasks-api.onrender.com`), **no trailing slash**.  
5. **Deploy**. Wait for the build to finish. Copy your frontend URL (e.g. `https://your-project.vercel.app`).

### Step 4: Allow the frontend to call the backend (CORS)

1. In **Render**, open your backend Web Service → **Environment** tab.  
2. Add or edit **`CORS_ORIGINS`** and set it to your Vercel frontend URL from Step 3, e.g. `https://your-project.vercel.app`.  
3. Click **Save Changes**; Render will redeploy with the new variable.

Then open your Vercel URL in a browser; the app should load and talk to the backend. Tasks and stats will be stored in Supabase—view and edit them in **Supabase Dashboard** → Table Editor.
