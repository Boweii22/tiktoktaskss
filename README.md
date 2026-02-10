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
