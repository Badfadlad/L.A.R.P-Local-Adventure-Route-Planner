# ======================================================================
# OWNER:  Person 3
# PART:   Part 4 - API endpoints for Bookmarks
# STATUS: TODO
# ======================================================================

"""Bookmark endpoints - TODO (Person 3, Part 4).

Suggested endpoints:
    GET /bookmarks, POST /bookmarks, PATCH /bookmarks/{id}, DELETE /bookmarks/{id}

Routes should stay thin: validate input with schemas from app.schemas.bookmark,
call functions in app.services.bookmark, and return response_model schemas.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])
