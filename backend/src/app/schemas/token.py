# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Schemas
# STATUS: DONE (used by Person 4's login route in Part 5)
# ======================================================================

"""Auth token schemas (used by Part 5 login route)."""

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """What we put inside / read out of the JWT payload."""

    user_id: int | None = None
    username: str | None = None
