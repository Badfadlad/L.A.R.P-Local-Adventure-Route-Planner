# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Models
# STATUS: DONE
# ======================================================================

from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.user import utcnow


class Review(Base):
    """A post-trip rating (1-5 stars) and optional comment for a place.

    `trip_id` is optional: it links the review to the trip where the visit
    happened (the "Review Your Visit" screen), which lets us compute a
    trip's overall rating.
    """

    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating_1_5"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), index=True, nullable=False)
    trip_id: Mapped[int | None] = mapped_column(ForeignKey("trips.id", ondelete="SET NULL"), index=True)

    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    visited_on: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="reviews")
    place: Mapped["Place"] = relationship(back_populates="reviews")
    trip: Mapped["Trip | None"] = relationship(back_populates="reviews")

    def __repr__(self) -> str:
        return f"<Review id={self.id} place_id={self.place_id} rating={self.rating}>"
