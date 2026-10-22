# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Models
# STATUS: DONE
# ======================================================================

from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import TransportMode, TripStatus
from app.models.user import utcnow


def _enum(enum_cls):
    # Store the enum's value ("walking") in the DB rather than its name ("WALKING").
    return Enum(enum_cls, values_callable=lambda e: [m.value for m in e])


class Trip(Base):
    """A saved route/itinerary, e.g. "San Diego Saturday" or "Date Night".

    A user can have many trips. Completed trips make up their travel history.
    """

    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    destination: Mapped[str | None] = mapped_column(String(150))  # e.g. "San Diego, CA"
    trip_date: Mapped[date | None] = mapped_column(Date)
    start_time: Mapped[time | None] = mapped_column(Time)
    transport_mode: Mapped[TransportMode] = mapped_column(
        _enum(TransportMode), default=TransportMode.WALKING, nullable=False
    )
    # The user's spending limit for the day (the "Total budget" box in the route builder)
    budget: Mapped[float | None] = mapped_column(Float)

    status: Mapped[TripStatus] = mapped_column(_enum(TripStatus), default=TripStatus.PLANNED, index=True, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="trips")
    # Always loaded in itinerary order.
    stops: Mapped[list["TripStop"]] = relationship(
        back_populates="trip", cascade="all, delete-orphan", order_by="TripStop.position"
    )
    reviews: Mapped[list["Review"]] = relationship(back_populates="trip")

    @property
    def stop_count(self) -> int:
        return len(self.stops)

    @property
    def estimated_total(self) -> float:
        """Total predicted cost = sum of each stop's cost."""
        return round(sum(stop.cost for stop in self.stops), 2)

    @property
    def remaining_budget(self) -> float | None:
        if self.budget is None:
            return None
        return round(self.budget - self.estimated_total, 2)

    @property
    def overall_rating(self) -> float | None:
        """Average of the ratings the user left for places on this trip."""
        ratings = [r.rating for r in self.reviews]
        if not ratings:
            return None
        return round(sum(ratings) / len(ratings), 2)

    def __repr__(self) -> str:
        return f"<Trip id={self.id} name={self.name!r} user_id={self.user_id}>"


class TripStop(Base):
    """One stop in a trip. `position` gives the order (1 = first stop)."""

    __tablename__ = "trip_stops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), index=True, nullable=False)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), index=True, nullable=False)

    position: Mapped[int] = mapped_column(Integer, nullable=False)
    arrival_time: Mapped[time | None] = mapped_column(Time)
    duration_minutes: Mapped[int | None] = mapped_column(Integer)
    # Optional override; if null we fall back to the place's estimated_cost
    estimated_cost: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(String(500))

    trip: Mapped["Trip"] = relationship(back_populates="stops")
    place: Mapped["Place"] = relationship(back_populates="trip_stops")

    @property
    def cost(self) -> float:
        """The cost used for budgeting: the override if set, else the place's estimate."""
        if self.estimated_cost is not None:
            return self.estimated_cost
        return self.place.estimated_cost if self.place else 0.0

    def __repr__(self) -> str:
        return f"<TripStop trip_id={self.trip_id} position={self.position} place_id={self.place_id}>"
