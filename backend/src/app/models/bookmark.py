# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Models
# STATUS: DONE
# ======================================================================

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.user import utcnow


class Bookmark(Base):
    """A place a user saved to come back to. A user can bookmark a place only once."""

    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "place_id", name="uq_bookmark_user_place"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), index=True, nullable=False)
    note: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="bookmarks")
    place: Mapped["Place"] = relationship(back_populates="bookmarks")

    def __repr__(self) -> str:
        return f"<Bookmark user_id={self.user_id} place_id={self.place_id}>"
