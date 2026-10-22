# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Schemas
# STATUS: DONE
# ======================================================================

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.place import PlaceSummary


class BookmarkCreate(BaseModel):
    place_id: int
    note: str | None = Field(default=None, max_length=300)


class BookmarkUpdate(BaseModel):
    note: str | None = Field(default=None, max_length=300)


class BookmarkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    place_id: int
    note: str | None = None
    created_at: datetime
    place: PlaceSummary
