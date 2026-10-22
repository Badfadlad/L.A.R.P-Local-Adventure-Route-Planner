# ======================================================================
# OWNER:  Person 2
# PART:   Part 4 - API endpoints for Trips
# STATUS: TODO
# ======================================================================

"""Trip / TripStop endpoints - TODO (Person 2, Part 4).

Suggested endpoints:
    GET /trips (current user's trips, ?status=completed for travel history), GET /trips/{id}, POST /trips, PATCH /trips/{id}, DELETE /trips/{id},
    POST /trips/{id}/stops, PATCH /trips/{id}/stops/{stop_id}, DELETE /trips/{id}/stops/{stop_id}, PUT /trips/{id}/stops/order, POST /trips/{id}/complete

Routes should stay thin: validate input with schemas from app.schemas.trip,
call functions in app.services.trip, and return response_model schemas.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/trips", tags=["trips"])
