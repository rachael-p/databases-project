from fastapi import APIRouter, Query
from db import fetch_all
import queries.chemicals as queries 

router = APIRouter(prefix="/chemicals", tags=["chemicals"])

# returns all chemical names with CAS ids
@router.get("/names")
def get_all_chemicals():
    rows = fetch_all(queries.GET_ALL_CHEMICALS, {})
    return {"count": len(rows), "results": rows}

# returns top n (default 10) chemicals released in a given year
@router.get("/top-releases")
def top_releases(
    year: int = Query(2024, ge=1987, le=2100),
    n: int = Query(10, ge=1, le=1000),
):
    rows = fetch_all(
        queries.TOP_N_CHEMICALS, 
        {"year": year, "limit": n},
    )
    return {"count": len(rows), "results": rows}

# returns top n (default 10) carcinogens released in a given year
@router.get("/top-carcinogens")
def top_carcinogens(
    year: int = Query(2024, ge=1987, le=2100),
    n: int = Query(10, ge=1, le=1000),
):
    rows = fetch_all(
        queries.TOP_N_CARCINOGENS, 
        {"year": year, "limit": n},
    )
    return {"count": len(rows), "results": rows}

# returns total releases over time for a chemical, optionally filtered by city/state/region
@router.get("/releases-over-time")
def releases_over_time(
    chem_id: str = Query(min_length=1),
    start_year: int = Query(1987, ge=1987, le=2100),
    end_year: int = Query(2100, ge=1987, le=2100),
    city: str | None = Query(None),
    state: str | None = Query(None),
    region: str | None = Query(None),
):
    rows = fetch_all(
        queries.RELEASES_OVER_TIME, 
        {"chem_id": chem_id, "start_year": start_year, "end_year": end_year, "city": city, "state": state, "region": region},
    )
    return {"count": len(rows), "results": rows}

# returns n states with top releases for a chemical in a given year 
@router.get("/top-states")
def top_states(
    chem_id: str = Query(min_length=1),
    year: int = Query(2024, ge=1987, le=2100),
    n: int = Query(10, ge=1, le=1000),
):
    rows = fetch_all(
        queries.TOP_STATES_BY_TOTAL_RELEASES, 
        {"chem_id": chem_id, "year": year, "limit": n},
    )
    return {"count": len(rows), "results": rows}

# returns average carcinogens per epa region (across facilities located there) in a given year 
@router.get("/avg-carcinogens-by-region")
def avg_carcinogen_by_region(
    year: int = Query(2024, ge=1987, le=2100),
):
    rows = fetch_all(
        queries.AVG_CARCINOGENS_PER_REGION, 
        {"year": year},
    )
    return {"count": len(rows), "results": rows}

# returns number of facilities, states, and cities that reported releases for a chemical over time
@router.get("/counts-over-time")
def counts_over_time(
    chem_id: str = Query(min_length=1),
):
    rows = fetch_all(
        queries.NUM_FACILITIES_STATES_CITIES_OVER_TIME,
        {"chem_id": chem_id},
    )
    return {"count": len(rows), "results": rows}

# returns number of facilities, states, and cities that reported releases for a chemical over time
@router.get("/counts-over-time")
def counts_over_time(
    chem_id: str = Query(min_length=1),
):
    rows = fetch_all(
        queries.NUM_FACILITIES_STATES_CITIES_OVER_TIME,
        {"chem_id": chem_id},
    )
    return {"count": len(rows), "results": rows}