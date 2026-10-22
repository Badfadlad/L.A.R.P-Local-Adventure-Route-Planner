# ======================================================================
# OWNER:  Person 4
# PART:   Part 5 - Login endpoint
# STATUS: TODO
# ======================================================================

"""Login endpoint - TODO (Person 4, Part 5).

Suggested: POST /auth/login using OAuth2PasswordRequestForm, returning app.schemas.token.Token.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])
