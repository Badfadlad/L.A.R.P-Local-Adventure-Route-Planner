# ======================================================================
# OWNER:  Person 1 (Anay) + Person 4
# PART:   Part 6 - Testing
# STATUS: Model/schema tests DONE by Person 1 / Person 4 adds CRUD + endpoint tests
# ======================================================================

"""Sanity tests for Part 2 (models + schemas)."""

from datetime import date, time

import pytest
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app.models import Bookmark, Place, PlaceCategory, Review, TransportMode, Trip, TripStatus, TripStop, User
from app.schemas import (
    BookmarkRead,
    PlaceRead,
    ReviewCreate,
    TripCreate,
    TripRead,
    TripSummary,
    UserCreate,
    UserRead,
)


def make_user(db, username="anay"):
    user = User(username=username, email=f"{username}@example.com", hashed_password="fake-hash")
    db.add(user)
    db.commit()
    return user


def make_place(db, name, cost, category=PlaceCategory.PARK):
    place = Place(name=name, category=category, city="San Diego", estimated_cost=cost)
    db.add(place)
    db.commit()
    return place


def make_trip(db):
    """Recreates the 'San Diego Saturday' trip from the Route Builder design."""
    user = make_user(db)
    coffee = make_place(db, "Better Buzz Coffee", 12, PlaceCategory.CAFE)
    park = make_place(db, "Balboa Park", 0)
    lunch = make_place(db, "The Prado", 32, PlaceCategory.FOOD)
    garden = make_place(db, "Japanese Friendship Garden", 16)

    trip = Trip(user=user, name="San Diego Saturday", trip_date=date(2026, 10, 17), start_time=time(9, 0), budget=100)
    # Added out of order on purpose - relationship should sort by position
    trip.stops = [
        TripStop(place=lunch, position=3),
        TripStop(place=coffee, position=1, arrival_time=time(9, 0), duration_minutes=45),
        TripStop(place=garden, position=4),
        TripStop(place=park, position=2),
    ]
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def test_trip_defaults_and_budget(db):
    trip = make_trip(db)
    assert trip.status == TripStatus.PLANNED
    assert trip.transport_mode == TransportMode.WALKING
    assert trip.stop_count == 4
    assert trip.estimated_total == 60  # 12 + 0 + 32 + 16, matches the design
    assert trip.remaining_budget == 40
    assert [s.place.name for s in trip.stops] == [
        "Better Buzz Coffee", "Balboa Park", "The Prado", "Japanese Friendship Garden",
    ]


def test_stop_cost_override(db):
    trip = make_trip(db)
    trip.stops[2].estimated_cost = 20  # cheaper lunch than the place estimate
    db.commit()
    assert trip.estimated_total == 48


def test_trip_read_schema_serializes_orm_object(db):
    trip = make_trip(db)
    data = TripRead.model_validate(trip)
    assert data.estimated_total == 60
    assert data.stops[0].place.name == "Better Buzz Coffee"
    assert data.stops[0].cost == 12
    assert data.overall_rating is None
    assert TripSummary.model_validate(trip).stop_count == 4
    # enums come out as plain strings in JSON
    assert data.model_dump(mode="json")["transport_mode"] == "walking"


def test_reviews_drive_place_and_trip_ratings(db):
    trip = make_trip(db)
    park = trip.stops[1].place
    db.add_all([
        Review(user=trip.user, place=park, trip=trip, rating=4),
        Review(user=trip.user, place=trip.stops[0].place, trip=trip, rating=5),
    ])
    db.commit()
    db.refresh(trip)
    db.refresh(park)
    assert park.average_rating == 4
    assert PlaceRead.model_validate(park).review_count == 1
    assert trip.overall_rating == 4.5


def test_review_rating_must_be_1_to_5(db):
    user = make_user(db)
    place = make_place(db, "Sunset Cliffs", 0)
    db.add(Review(user=user, place=place, rating=6))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
    with pytest.raises(ValidationError):
        ReviewCreate(place_id=place.id, rating=0)


def test_bookmark_is_unique_per_user_and_place(db):
    user = make_user(db)
    place = make_place(db, "Sunset Cliffs", 0, PlaceCategory.VIEWPOINT)
    db.add(Bookmark(user=user, place=place))
    db.commit()
    assert BookmarkRead.model_validate(user.bookmarks[0]).place.name == "Sunset Cliffs"
    db.add(Bookmark(user=user, place=place))
    with pytest.raises(IntegrityError):
        db.commit()


def test_deleting_user_deletes_their_data(db):
    trip = make_trip(db)
    db.add(Bookmark(user=trip.user, place=trip.stops[0].place))
    db.commit()
    db.delete(trip.user)
    db.commit()
    assert db.query(Trip).count() == 0
    assert db.query(TripStop).count() == 0
    assert db.query(Bookmark).count() == 0
    assert db.query(Place).count() == 4  # places are shared, they stay


def test_user_schemas():
    with pytest.raises(ValidationError):
        UserCreate(username="anay", email="not-an-email", password="password123")
    with pytest.raises(ValidationError):
        UserCreate(username="anay", email="anay@example.com", password="short")
    # UserRead never exposes a password
    assert "password" not in UserRead.model_fields
    assert "hashed_password" not in UserRead.model_fields


def test_trip_create_accepts_nested_stops():
    payload = TripCreate(
        name="Date Night",
        budget=85,
        transport_mode="driving",
        stops=[{"place_id": 1}, {"place_id": 2, "arrival_time": "19:30"}],
    )
    assert payload.transport_mode == TransportMode.DRIVING
    assert payload.stops[1].arrival_time == time(19, 30)


def test_deleting_trip_keeps_reviews(db):
    trip = make_trip(db)
    db.add(Review(user=trip.user, place=trip.stops[0].place, trip=trip, rating=5))
    db.commit()
    db.delete(trip)
    db.commit()
    review = db.query(Review).one()
    assert review.trip_id is None
