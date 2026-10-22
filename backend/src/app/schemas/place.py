# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Schemas
# STATUS: DONE
# ======================================================================

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PlaceCategory


class PlaceBase(BaseModel):
    name: str = Field(min_length=1, max_length=150, examples=["Balboa Park"])
    category: PlaceCategory = Field(examples=[PlaceCategory.PARK])
    subcategory: str | None = Field(default=None, max_length=100, examples=["Gardens"])
    description: str | None = None
    address: str | None = Field(default=None, max_length=255)
    neighborhood: str | None = Field(default=None, max_length=100, examples=["Balboa Park"])
    city: str = Field(min_length=1, max_length=100, examples=["San Diego"])
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    estimated_cost: float = Field(default=0.0, ge=0, description="Estimated cost per person in USD (0 = free)")
    typical_duration_minutes: int | None = Field(default=None, gt=0)
    image_url: str | None = Field(default=None, max_length=500)


class PlaceCreate(PlaceBase):
    pass


class PlaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    category: PlaceCategory | None = None
    subcategory: str | None = Field(default=None, max_length=100)
    description: str | None = None
    address: str | None = Field(default=None, max_length=255)
    neighborhood: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    estimated_cost: float | None = Field(default=None, ge=0)
    typical_duration_minutes: int | None = Field(default=None, gt=0)
    image_url: str | None = Field(default=None, max_length=500)


class PlaceSummary(BaseModel):
    """Small version of a place, nested inside trip stops / bookmarks / reviews."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: PlaceCategory
    subcategory: str | None = None
    neighborhood: str | None = None
    city: str
    estimated_cost: float
    image_url: str | None = None


class PlaceRead(PlaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    # Computed from reviews (see Place.average_rating in models/place.py)
    average_rating: float | None = None
    review_count: int = 0


class PlaceSearchParams(BaseModel):
    """Filters for the Discover page: GET /places?q=&category=&neighborhood=&max_cost=

    Tip for Person 2: use it in a route as `params: PlaceSearchParams = Depends()`.
    """

    q: str | None = Field(default=None, description="Text search on name/description")
    category: PlaceCategory | None = None
    neighborhood: str | None = None
    city: str | None = None
    min_cost: float | None = Field(default=None, ge=0)
    max_cost: float | None = Field(default=None, ge=0, description="e.g. 25 for the 'Under $25' chip")
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=20, ge=1, le=100)
