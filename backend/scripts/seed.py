# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 1 - Sample data (optional helper)
# STATUS: DONE
# ======================================================================

"""Fill the database with sample San Diego places (from our Figma designs).

Run from the project root:
    python scripts/seed.py

Safe to run more than once - places that already exist (same name + city) are skipped.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from app.core.database import SessionLocal, init_db  # noqa: E402
from app.models import Place, PlaceCategory  # noqa: E402

SAMPLE_PLACES = [
    dict(name="Balboa Park", category=PlaceCategory.PARK, subcategory="Gardens", neighborhood="Balboa Park",
         estimated_cost=0, typical_duration_minutes=120, latitude=32.7341, longitude=-117.1446,
         description="1,200-acre urban park with gardens, museums and walking paths."),
    dict(name="Better Buzz Coffee", category=PlaceCategory.CAFE, subcategory="Coffee", neighborhood="Point Loma",
         estimated_cost=12, typical_duration_minutes=45, latitude=32.7480, longitude=-117.2181,
         description="Local coffee spot - good first stop of the day."),
    dict(name="Sunset Cliffs", category=PlaceCategory.VIEWPOINT, subcategory="Scenic View", neighborhood="Ocean Beach",
         estimated_cost=0, typical_duration_minutes=60, latitude=32.7157, longitude=-117.2544,
         description="Ocean cliffs, best around sunset."),
    dict(name="The Prado", category=PlaceCategory.FOOD, subcategory="Lunch", neighborhood="Balboa Park",
         estimated_cost=32, typical_duration_minutes=75, latitude=32.7314, longitude=-117.1505,
         description="Restaurant inside Balboa Park's House of Hospitality."),
    dict(name="Japanese Friendship Garden", category=PlaceCategory.PARK, subcategory="Garden · Cultural",
         neighborhood="Balboa Park", estimated_cost=16, typical_duration_minutes=90,
         latitude=32.7301, longitude=-117.1490, description="Traditional Japanese garden in Balboa Park."),
    dict(name="San Diego Zoo", category=PlaceCategory.ACTIVITY, subcategory="Zoo", neighborhood="Balboa Park",
         estimated_cost=72, typical_duration_minutes=240, latitude=32.7353, longitude=-117.1490,
         description="World-famous zoo."),
    dict(name="La Jolla Cove", category=PlaceCategory.BEACH, subcategory="Beach", neighborhood="La Jolla",
         estimated_cost=0, typical_duration_minutes=90, latitude=32.8504, longitude=-117.2713,
         description="Small beach known for sea lions and snorkeling."),
    dict(name="Liberty Public Market", category=PlaceCategory.FOOD, subcategory="Food Hall", neighborhood="Point Loma",
         estimated_cost=20, typical_duration_minutes=60, latitude=32.7408, longitude=-117.2104,
         description="Food hall with dozens of local vendors."),
    dict(name="Seaport Village", category=PlaceCategory.SHOP, subcategory="Shopping", neighborhood="Downtown",
         estimated_cost=25, typical_duration_minutes=60, latitude=32.7091, longitude=-117.1710,
         description="Waterfront shops and snacks."),
]


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        added = 0
        for data in SAMPLE_PLACES:
            exists = db.query(Place).filter_by(name=data["name"], city="San Diego").first()
            if not exists:
                db.add(Place(city="San Diego", **data))
                added += 1
        db.commit()
        print(f"Seeded {added} new place(s). Total places: {db.query(Place).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
