# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Models
# STATUS: DONE
# ======================================================================

"""Import every model here so SQLAlchemy knows about all tables
(and relationships between files resolve) before create_all() runs.

    from app.models import User, Place, Trip, TripStop, Bookmark, Review
"""

from app.models.bookmark import Bookmark
from app.models.enums import PlaceCategory, TransportMode, TripStatus
from app.models.place import Place
from app.models.review import Review
from app.models.trip import Trip, TripStop
from app.models.user import User

__all__ = [
    "User",
    "Place",
    "Trip",
    "TripStop",
    "Bookmark",
    "Review",
    "PlaceCategory",
    "TransportMode",
    "TripStatus",
]
