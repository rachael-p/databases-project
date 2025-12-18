from fastapi import APIRouter, Query
from db import fetch_all
import queries.source_reductions as queries 

router = APIRouter(prefix="/sourcered", tags=["sourcered"])

# returns all sourc reduction strategies
@router.get("/names")
def get_all_src_red():
    rows = fetch_all(queries.GET_ALL_SRC_RED, {})
    return {"count": len(rows), "results": rows}

# returns all strategies that achieved 100$ elimination of chemical for a year
@router.get("/most-effective")
def most_effective_strats(
    limit: int = Query(50, ge=1)
):
    rows = fetch_all(
        queries.MOST_EFFECTIVE_STRATS,
        {"limit": limit},
    )
    return {"count": len(rows), "results": rows}

# returns total releases before vs after implementing source reduction 
@router.get("/before-after")
def before_after_src(
    limit: int = Query(20, ge=1)
):
    rows = fetch_all(
        queries.BEFORE_AFTER_SRC,
        {"limit": limit},
    )
    return {"count": len(rows), "results": rows}

# returns the most frequently reduced chemicals per state in a year range
@router.get("/top-chem-by-state")
def top_chem_red_per_state(
    start_year: int = Query(1900, ge=1900, le=2100),
    end_year: int = Query(2100, ge=1900, le=2100),
):
    rows = fetch_all(
        queries.TOP_CHEM_RED_PER_STATE,
        {"start_year": start_year, "end_year": end_year},
    )
    return {"count": len(rows), "results": rows}


# returns estimated reduction descriptions per strategy for a facility and year range
@router.get("/facility-vs-strats")
def facility_red_vs_strats(
    facility_id: str = Query(min_length=1),
    start_year: int = Query(1900, ge=1900, le=2100),
    end_year: int = Query(2100, ge=1900, le=2100),
):
    rows = fetch_all(
        queries.FACILITY_RED_VS_STRATS,
        {"facility_id": facility_id, "start_year": start_year, "end_year": end_year},
    )
    return {"count": len(rows), "results": rows}

# returns most common effectiveness for each strategy 
@router.get("/typical-effectiveness")
def typical_effectiveness():
    rows = fetch_all(
        queries.TYPICAL_EFFECTIVENESS,
        {},
    )
    return {"count": len(rows), "results": rows}

