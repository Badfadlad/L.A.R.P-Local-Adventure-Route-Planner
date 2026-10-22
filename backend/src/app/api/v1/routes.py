# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 1 - Project Setup
# STATUS: DONE - every teammate's router is already plugged in below
# ======================================================================

"""Collects every router under /api/v1.

Each teammate defines `router = APIRouter(...)` in their file under
app/routes/ - it's already wired in below, so new endpoints show up
in /docs automatically.
"""

from fastapi import APIRouter

from app.routes import auth, bookmark, place, review, trip, user

api_router = APIRouter()

api_router.include_router(auth.router)      # /auth      (Person 4)
api_router.include_router(user.router)      # /users     (Person 3)
api_router.include_router(place.router)     # /places    (Person 2)
api_router.include_router(trip.router)      # /trips     (Person 2)
api_router.include_router(bookmark.router)  # /bookmarks (Person 3)
api_router.include_router(review.router)    # /reviews   (Person 3)
