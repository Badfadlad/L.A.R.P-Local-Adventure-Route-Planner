# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 2 - Models
# STATUS: DONE
# ======================================================================

"""Enums shared by the ORM models and the Pydantic schemas.

They subclass `str`, so they serialize to plain strings in JSON
(e.g. "park", "walking").
"""

import enum


class PlaceCategory(str, enum.Enum):
    FOOD = "food"
    CAFE = "cafe"
    PARK = "park"
    SHOP = "shop"
    ACTIVITY = "activity"
    MUSEUM = "museum"
    VIEWPOINT = "viewpoint"
    BEACH = "beach"
    NIGHTLIFE = "nightlife"
    OTHER = "other"


class TransportMode(str, enum.Enum):
    WALKING = "walking"
    DRIVING = "driving"
    BIKING = "biking"
    TRANSIT = "transit"


class TripStatus(str, enum.Enum):
    PLANNED = "planned"      # still being built / upcoming
    COMPLETED = "completed"  # shows up in travel history, can be reviewed
