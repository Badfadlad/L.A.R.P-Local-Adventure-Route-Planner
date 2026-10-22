# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Models
# STATUS: DONE
# ======================================================================

from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import PlaceCategory
from app.models.user import utcnow


class Place(Base):
    """A location users can discover, bookmark, add to trips and review
    (restaurants, parks, shops, viewpoints...)."""

    __tablename__ = "places"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    category: Mapped[PlaceCategory] = mapped_column(
        Enum(PlaceCategory, values_callable=lambda e: [m.value for m in e]), index=True, nullable=False
    )
    subcategory: Mapped[str | None] = mapped_column(String(100))  # e.g. "Gardens", "Coffee"
    description: Mapped[str | None] = mapped_column(Text)

    # Location - used for search by neighborhood/city and for route building
    address: Mapped[str | None] = mapped_column(String(255))
    neighborhood: Mapped[str | None] = mapped_column(String(100), index=True)
    city: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)

    # Budgeting - estimated cost for ONE person in USD (0 = free)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    # Typical time spent here, used as the default stop duration in the route builder
    typical_duration_minutes: Mapped[int | None] = mapped_column(Integer)

    image_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    reviews: Mapped[list["Review"]] = relationship(back_populates="place", cascade="all, delete-orphan")
    bookmarks: Mapped[list["Bookmark"]] = relationship(back_populates="place", cascade="all, delete-orphan")
    trip_stops: Mapped[list["TripStop"]] = relationship(back_populates="place")

    @property
    def average_rating(self) -> float | None:
        """Average review rating (1-5), or None if nobody has reviewed it yet."""
        if not self.reviews:
            return None
        return round(sum(r.rating for r in self.reviews) / len(self.reviews), 2)

    @property
    def review_count(self) -> int:
        return len(self.reviews)

    def __repr__(self) -> str:
        return f"<Place id={self.id} name={self.name!r} category={self.category.value}>"
