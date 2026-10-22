# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Schemas
# STATUS: DONE
# ======================================================================

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.place import PlaceSummary


class ReviewBase(BaseModel):
    rating: int = Field(ge=1, le=5, description="1-5 stars")
    comment: str | None = Field(default=None, max_length=2000)
    visited_on: date | None = None


class ReviewCreate(ReviewBase):
    place_id: int
    trip_id: int | None = Field(default=None, description="The trip this visit was part of, if any")


class ReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)
    visited_on: date | None = None


class ReviewRead(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    place_id: int
    trip_id: int | None = None
    created_at: datetime
    place: PlaceSummary
