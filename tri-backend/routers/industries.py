from fastapi import APIRouter, Query
from db import fetch_all
import queries.industries as queries

router = APIRouter(prefix="/industries", tags=["industries"])

# returns releases by industry for a year (can make into pie chart after converting to percent)
@router.get("/releases-by-industry")
def releases_by_industry(
    year: int = Query(ge=1900, le=2100),
):
    rows = fetch_all(
        queries.RELEASES_BY_INDUSTRY,
        {"year": year},
    )
    return {"count": len(rows), "results": rows}

# returns releases per medium for a given industry over an optional year range 
@router.get("/releases-per-medium")
def releases_per_medium(
    industry_code: str = Query(min_length=1),
    start_year: int = Query(1900, ge=1900, le=2100),
    end_year: int = Query(2100, ge=1900, le=2100),
):
    results = {}
    for year in range(start_year, end_year + 1):
        rows = fetch_all(
            queries.RELEASES_PER_MEDIUM,
            {"industry": industry_code, "year": year},
        )
        if rows:
            results[year] = rows
    return {"count": len(results),"results": results}