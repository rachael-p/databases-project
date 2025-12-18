# EPA TRI Data Explorer
Full-stack project for exploring EPA TRI data. The repo includes:
- Backend API (`tri-backend`) built with FastAPI + MariaDB
- React frontend (`tri-frontend`)
- Docker Compose config to run DB, API, and frontend together

## Run with Docker
Prereqs: Docker + Docker Compose.

1) Create a `.env` file in the repo root (used by `docker-compose.yml`) following the keys in `.env.example`:
- Copy `.env.example` to `.env`
- Fill in your own credentials and any CORS origins you need. Requires an Open AI API key in order to use the NLI.
2) Start the stack:
```bash
docker compose up --build
```
- MariaDB runs at `localhost:3306` and auto-imports `db/init/epa_dump.sql` on first boot.
- API available at `http://localhost:8000` (docs at `/docs`).
- Frontend available at `http://localhost:3000` with `REACT_APP_API_BASE` set to the local API.

To stop and remove containers: `docker compose down` (add `-v` to drop the DB volume).

