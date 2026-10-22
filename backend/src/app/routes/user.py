# ======================================================================
# OWNER:  Person 3
# PART:   Part 4 - API endpoints for Users
# STATUS: TODO
# ======================================================================

"""User endpoints - TODO (Person 3, Part 4).

Suggested endpoints:
    POST /users (register), GET /users/me (UserProfile), PATCH /users/me, GET /users/{id}

Routes should stay thin: validate input with schemas from app.schemas.user,
call functions in app.services.user, and return response_model schemas.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])
