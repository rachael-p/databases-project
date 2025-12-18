from fastapi import APIRouter, Query
from db import fetch_all
import queries.misc as queries

router = APIRouter(prefix="/misc", tags=["misc"])

@router.get("/total-per-region")
def total_per_region(year: int = Query(2024, ge=1900, le=2100)):
    rows = fetch_all(
        queries.TOTAL_PER_REGION,
        {"year": year},
    )
    return {"count": len(rows), "results": rows}


@router.get("/top-cities-air-releases")
def top_cities_air_releases(
    start_year: int = Query(1900, ge=1900, le=2100),
    end_year: int = Query(2100, ge=1900, le=2100),
    n: int = Query(25, ge=1, le=500),
):
    rows = fetch_all(
        queries.TOP_CITIES_AIR_RELEASES,
        {"start_year": start_year, "end_year": end_year, "limit": n},
    )
    return {"count": len(rows), "results": rows}


@router.get("/top-industry-per-region")
def top_industry_per_region(year: int = Query(2024,ge=1900, le=2100)):
    rows = fetch_all(
        queries.TOP_INDUSTRY_PER_REGION,
        {"year": year},
    )
    return {"count": len(rows), "results": rows}


@router.get("/avg-releases-presidency")
def avg_releases_presidency():
    rows = fetch_all(
        queries.AVG_RELEASES_PRESIDENCY,
        {},
    )
    return {"count": len(rows), "results": rows}
