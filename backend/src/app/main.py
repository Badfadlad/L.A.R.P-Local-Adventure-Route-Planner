# ======================================================================
# OWNER:  Person 1 (Anay) + Person 4
# PART:   Part 1 (app setup) + Part 5 (middleware)
# STATUS: App setup DONE by Person 1 / CORS + logging middleware TODO by Person 4
# ======================================================================

"""FastAPI entry point.

Run from the project root:
    uvicorn app.main:app --reload --app-dir src
Then open http://127.0.0.1:8000/docs
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.routes import api_router
from app.core.database import init_db
from app.core.settings import settings


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

# TODO (Person 4 - Part 5): add CORSMiddleware (use settings.cors_origins_list)
# and a request-logging middleware here.

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
