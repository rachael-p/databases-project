from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import facilities_router, industries_router, nlquery_router, query_analyzer_router

app = FastAPI(title="EPA MariaDB API")

# React dev server usually runs on http://localhost:3000 or 5173 (Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

routers = [facilities_router, industries_router, nlquery_router, query_analyzer_router]
for router in routers:
    app.include_router(router)
