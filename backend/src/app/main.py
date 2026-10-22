# ======================================================================
# OWNER:  Person 1 (Anay) + Person 4
# PART:   Part 1 (app setup) + Part 5 (middleware)
# STATUS: App setup DONE by Person 1 / CORS + logging middleware DONE by Person 4
# ======================================================================

"""FastAPI entry point.

Run from the project root:
    uvicorn app.main:app --reload --app-dir src
Then open http://127.0.0.1:8000/docs
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import api_router
from app.core.database import init_db
from app.core.settings import settings

logger = logging.getLogger("app.requests")
# Print request logs to the console (where uvicorn prints its own output).
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())
logger.setLevel(logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup (fine for a class project;
    # a production app would use migrations, e.g. Alembic).
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Backend for L.A.R.P - Local Adventure Route Planner",
    version="0.1.0",
    lifespan=lifespan,
)

# --- Middleware (Person 4 - Part 5) ------------------------------------

# CORS lets the React frontend (a different origin, e.g. localhost:5173)
# call this API from the browser. Allowed origins come from CORS_ORIGINS in .env.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log one line per request, e.g. `GET /api/v1/places -> 200 (3.1 ms)`,
    and add an X-Process-Time header (seconds) to the response."""
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    logger.info(
        "%s %s -> %s (%.1f ms)",
        request.method, request.url.path, response.status_code, duration * 1000,
    )
    response.headers["X-Process-Time"] = f"{duration:.4f}"
    return response


app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
