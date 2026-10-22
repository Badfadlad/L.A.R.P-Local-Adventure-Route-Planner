# ======================================================================
# OWNER:  Person 3
# PART:   Part 4 - API endpoints for Reviews
# STATUS: TODO
# ======================================================================

"""Review endpoints - TODO (Person 3, Part 4).

Suggested endpoints:
    GET /reviews?place_id=, GET /users/me/reviews, POST /reviews, PATCH /reviews/{id}, DELETE /reviews/{id}

Routes should stay thin: validate input with schemas from app.schemas.review,
call functions in app.services.review, and return response_model schemas.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/reviews", tags=["reviews"])
