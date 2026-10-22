# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Schemas
# STATUS: DONE
# ======================================================================

from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TransportMode, TripStatus
from app.schemas.place import PlaceSummary

# ---------------------------------------------------------------- Trip stops


class TripStopBase(BaseModel):
    place_id: int
    arrival_time: time | None = Field(default=None, examples=["09:00"])
    duration_minutes: int | None = Field(default=None, gt=0, examples=[45])
    estimated_cost: float | None = Field(
        default=None, ge=0, description="Override the place's cost for this stop. Leave empty to use the place's estimate."
    )
    notes: str | None = Field(default=None, max_length=500)


class TripStopCreate(TripStopBase):
    # Optional: if omitted, the service should append the stop to the end.
    position: int | None = Field(default=None, ge=1)


class TripStopUpdate(BaseModel):
    position: int | None = Field(default=None, ge=1)
    arrival_time: time | None = None
    duration_minutes: int | None = Field(default=None, gt=0)
    estimated_cost: float | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=500)


class TripStopRead(TripStopBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trip_id: int
    position: int
    cost: float  # the cost actually used for the budget (override or place estimate)
    place: PlaceSummary


class TripStopReorder(BaseModel):
    """'Drag to reorder your day': the stop ids in their new order."""

    stop_ids: list[int] = Field(min_length=1)


# ---------------------------------------------------------------- Trips


class TripBase(BaseModel):
    name: str = Field(min_length=1, max_length=150, examples=["San Diego Saturday"])
    description: str | None = None
    destination: str | None = Field(default=None, max_length=150, examples=["San Diego, CA"])
    trip_date: date | None = Field(default=None, examples=["2026-10-17"])
    start_time: time | None = Field(default=None, examples=["09:00"])
    transport_mode: TransportMode = TransportMode.WALKING
    budget: float | None = Field(default=None, ge=0, examples=[100])


class TripCreate(TripBase):
    # Optionally create the trip with its stops in one request.
    stops: list[TripStopCreate] = Field(default_factory=list)


class TripUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    destination: str | None = Field(default=None, max_length=150)
    trip_date: date | None = None
    start_time: time | None = None
    transport_mode: TransportMode | None = None
    budget: float | None = Field(default=None, ge=0)
    status: TripStatus | None = None


class TripSummary(TripBase):
    """Card on the profile page: 'San Diego Saturday · Oct 17 · 4 Stops · $60 Estimated'."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: TripStatus
    stop_count: int
    estimated_total: float
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class TripRead(TripSummary):
    """Full itinerary overview: stops in order, cost estimate, budget and rating."""

    stops: list[TripStopRead] = Field(default_factory=list)
    remaining_budget: float | None = None
    overall_rating: float | None = None
