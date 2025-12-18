# FastAPI routers for the service
from .facilities import router as facilities_router
from .industries import router as industries_router
from .chemicals import router as chemicals_router
from .source_reductions import router as source_red_router
from .misc import router as misc_router
from .nlquery import router as nlquery_router
from .query_analyzer import router as query_analyzer_router
