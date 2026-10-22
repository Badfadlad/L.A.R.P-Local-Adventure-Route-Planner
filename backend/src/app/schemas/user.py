# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Schemas
# STATUS: DONE
# ======================================================================

"""User schemas.

Naming pattern used in every schema file:
    XBase    - fields shared by create + read
    XCreate  - what the client sends to create one (POST body)
    XUpdate  - what the client sends to edit one (PATCH body, all optional)
    XRead    - what the API returns (includes id, timestamps...)
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9_.]+$", examples=["anay"])
    email: EmailStr
    display_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=500)
    home_city: str | None = Field(default=None, max_length=100, examples=["San Diego, CA"])


class UserCreate(UserBase):
    # Plain-text password from the signup form. It gets hashed before saving -
    # never store or return this.
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    display_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=500)
    home_city: str | None = Field(default=None, max_length=100)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserRead(UserBase):
    """Returned by the API. Note: no password field."""

    model_config = ConfigDict(from_attributes=True)  # Pydantic v2 version of `orm_mode = True`

    id: int
    created_at: datetime


class UserProfile(UserRead):
    """Profile header stats ("12 Trips · 37 Places · 8 Reviews").
    The service layer fills these counts in."""

    trip_count: int = 0
    bookmark_count: int = 0
    review_count: int = 0
