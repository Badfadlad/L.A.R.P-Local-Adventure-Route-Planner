# ======================================================================
# OWNER:  Person 2
# PART:   Part 4 - API endpoints for Places
# STATUS: TODO
# ======================================================================

"""Place endpoints - TODO (Person 2, Part 4).

Suggested endpoints:
    GET /places (search with PlaceSearchParams), GET /places/{id}, POST /places, PATCH /places/{id}, DELETE /places/{id}

Routes should stay thin: validate input with schemas from app.schemas.place,
call functions in app.services.place, and return response_model schemas.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/places", tags=["places"])
