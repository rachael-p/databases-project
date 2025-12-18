from fastapi import APIRouter, Query
from db import fetch_all
import queries.facilities as queries 

router = APIRouter(prefix="/facilities", tags=["facilities"])

# returns all facility names with ids
@router.get("/names")
def get_all_facilities():
    rows = fetch_all(queries.GET_ALL_FACILITIES, {})
    return {"count": len(rows), "results": rows}

# returns top n (default 10) facilities by total release for a year, with optional state/region/industry
@router.get("/top-releases")
def top_releases(
    year: int = Query(2024, ge=1987, le=2100),
    n: int = Query(10, ge=1, le=1000),
    state: str | None = Query(None, min_length=2, max_length=2),
    region: str | None = Query(None, min_length=1, max_length=2),
    industry_code: int | None = Query(None, ge=0),
):
    rows = fetch_all(
        queries.TOP_N_FACILITIES_BY_RELEASES, 
        {"year": year, "state": state, "region": region, "industry": industry_code, "limit": n},
    )
    return {"count": len(rows), "results": rows}

# returns releases by medium for a facility for every year in the range specified
@router.get("/releases-by-medium")
def releases_by_medium(
    facility_id: str = Query(min_length=1),
    start_year: int = Query(1900, ge=1900, le=2100),
    end_year: int = Query(2100, ge=1900, le=2100),
):
    results = {}
    for year in range(start_year, end_year + 1):
        rows = fetch_all(
            queries.RELEASES_BY_MEDIUM,
            {"facility_id": facility_id, "year": year},
        )
        if rows:
            results[year] = rows
    return {"count": len(results),"results": results}
