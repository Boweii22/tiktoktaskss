# Impossible Tasks (TikTok-style)

## What was fixed

- **Backend (`server.py`)**  
  - PyMongo: `find_one_and_update` now uses `return_document=ReturnDocument.AFTER` instead of `return_document=True` (correct PyMongo 4.x API).  
  - Env: `MONGO_URL` and `DB_NAME` are optional; defaults: `mongodb://localhost:27017`, `impossible_tasks`.

- **Frontend**  
  - Craco: `dotenv` is loaded only if available so the dev server doesn’t crash when `dotenv` isn’t installed.  
  - API: When `REACT_APP_BACKEND_URL` is unset, all API methods short-circuit correctly (offline mode, no requests to `/api`).

## How to run

### 1. Backend (FastAPI + MongoDB)

- **MongoDB**: Start MongoDB locally (e.g. `mongodb://localhost:27017`) or set `MONGO_URL` in `backend/.env`.  
  If MongoDB isn’t running, the backend still starts; the frontend will use offline fallback tasks when the API fails.

- From the project root:
  ```bash
  cd backend
  pip install -r requirements.txt
  python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
  ```
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

### 3. Optional: run backend tests

From the project root:
```bash
python backend_test.py
```
(Uses a remote base URL by default; you can change it in the script to `http://localhost:8000` for local testing.)

---

## Deploy frontend on Vercel

Only the **frontend** is deployed to Vercel. The backend (FastAPI + MongoDB) is deployed on [Render](https://render.com)—see the exact steps below.

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

### 3. Backend and MongoDB

- Host the FastAPI app (e.g. [Render](https://render.com)). In the backend’s environment, set **`CORS_ORIGINS`** to your Vercel URL, e.g. `https://your-project.vercel.app` (or a comma-separated list if you use preview URLs).
- Use a MongoDB instance (e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) and set **`MONGO_URL`** in the backend’s environment.

---

## Exact deployment steps (order matters)

Do these in order. You can use **MongoDB Compass** with the same MongoDB the backend uses (local or Atlas)—see the Compass section below.

### Step 1: MongoDB (local or Atlas)

- **Option A – Local:** Keep using MongoDB on your machine. You’ll use the same `MONGO_URL` when running the backend locally and when you later deploy the backend (only if the deployed backend can reach your machine, which usually means you need a tunnel or use Atlas).
- **Option B – Atlas (recommended for a live app):**  
  1. Go to [cloud.mongodb.com](https://cloud.mongodb.com), sign in, create a free cluster.  
  2. **Database Access** → Add user (username + password).  
  3. **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere) so Render can connect.  
  4. **Connect** → **Connect your application** → copy the connection string (e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`).  
  5. Replace `<password>` with your DB user password. This is your **`MONGO_URL`**. You can add the database name: `...mongodb.net/impossible_tasks?retryWrites=...`.

**MongoDB Compass:** You can use Compass with either local or Atlas. For Atlas, in Compass paste the same connection string you use as `MONGO_URL`. For local, use `mongodb://localhost:27017`. Compass is just a client; it doesn’t care whether the app is on Vercel or not.

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
   - `MONGO_URL` = your MongoDB connection string (from Step 1).  
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

Then open your Vercel URL in a browser; the app should load and talk to the backend. Tasks and stats will be stored in the same MongoDB you set in `MONGO_URL`—view and edit them anytime in **MongoDB Compass** using that same connection string.
