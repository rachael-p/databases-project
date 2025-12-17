# EPA Data Explorer – Backend API
FastAPI service that surfaces EPA TRI data from a MariaDB instance. The React frontend (in `../tri-frontend`) consumes these endpoints to explore and visualize the dataset.

## Tech Stack
- Python + FastAPI
- SQLAlchemy Core + PyMySQL
- MariaDB

## Prerequisites
- Python 3.9+ with `pip`
- MariaDB running and loaded with the TRI tables used here (`tri_facility`, `tri_release`, etc.)
- Access to the React client if you want to use the UI (`../tri-frontend`)

## Setup
1) Create and activate a virtualenv (recommended):
```bash
python3 -m venv .venv
source .venv/bin/activate
```
2) Install backend dependencies:
```bash
pip install fastapi uvicorn "sqlalchemy>=2" pymysql python-dotenv
```
3) Configure environment variables in `.env` (same directory as `main.py`):
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=tri
```
4) Start the API:
```bash
uvicorn main:app --reload
```
The server listens on `http://127.0.0.1:8000`. Interactive docs are available at `/docs`.

## Available Endpoint
- `GET /facilities/top-releases`
  - Query params:
    - `year` (int, default 2022)
    - `state` (2-letter code, optional)
    - `limit` (int, default 25, max 200)
  - Returns facilities ordered by total release for the given year (optionally filtered by state).

Example request:
```bash
curl "http://127.0.0.1:8000/facilities/top-releases?year=2022&state=TX&limit=10"
```

## Notes
- CORS is open to `http://localhost:3000` and `http://localhost:5173` for local React development.
- SQL lives in `queries.py`; database connectivity is configured in `db.py`.
