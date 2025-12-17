from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from db import fetch_all
from queries import TOP_FACILITIES_BY_RELEASES

app = FastAPI(title="EPA MariaDB API")

# React dev server usually runs on http://localhost:3000 or 5173 (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/facilities/top-releases")
def top_facilities(
    year: int = Query(2022, ge=1987, le=2100),
    state: str | None = Query(None, min_length=2, max_length=2),
    limit: int = Query(25, ge=1, le=200),
):
    rows = fetch_all(
        TOP_FACILITIES_BY_RELEASES,
        {"year": year, "state": state, "limit": limit},
    )
    return {"count": len(rows), "results": rows}
