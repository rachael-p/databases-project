from fastapi import APIRouter, Query
from db import fetch_all
import queries.misc as queries

router = APIRouter(prefix="/misc", tags=["misc"])

# 
