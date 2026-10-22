# ======================================================================
# OWNER:  Person 4 (Nutsa)
# PART:   Part 6 - Testing
# STATUS: DONE
# ======================================================================

"""Tests for app/crud.py (Arjay's place + trip CRUD functions)."""

import pytest

# Skip this whole file until Arjay's app/crud.py is in the repo.
crud = pytest.importorskip("app.crud", reason="app/crud.py (Person 2) not added yet")

from app.models import PlaceCategory, TripStatus, TripStop, User  # noqa: E402
from app.schemas import (
    PlaceCreate,
    PlaceSearchParams,
    PlaceUpdate,
    TripCreate,
    TripStopCreate,
    TripStopUpdate,
    TripUpdate,
)


@pytest.fixture()
def places(db):
    """Four San Diego places, returned as a dict by short name."""
    data = {
        "coffee": PlaceCreate(name="Better Buzz Coffee", category=PlaceCategory.CAFE, city="San Diego",
                              neighborhood="Pacific Beach", estimated_cost=12),
        "park": PlaceCreate(name="Balboa Park", category=PlaceCategory.PARK, city="San Diego",
                            neighborhood="Balboa Park", description="Gardens and museums", estimated_cost=0),
        "lunch": PlaceCreate(name="The Prado", category=PlaceCategory.FOOD, city="San Diego",
                             neighborhood="Balboa Park", estimated_cost=32),
        "garden": PlaceCreate(name="Japanese Friendship Garden", category=PlaceCategory.PARK, city="San Diego",
                              neighborhood="Balboa Park", estimated_cost=16),
    }
    return {key: crud.create_place(db, value) for key, value in data.items()}


@pytest.fixture()
def other_user(db):
    user = User(username="mitchell", email="mitchell@example.com", hashed_password="fake-hash")
    db.add(user)
    db.commit()
    return user


@pytest.fixture()
def trip(db, user, places):
    data = TripCreate(name="San Diego Saturday", budget=100, stops=[
        TripStopCreate(place_id=places["coffee"].id),
        TripStopCreate(place_id=places["park"].id),
        TripStopCreate(place_id=places["lunch"].id),
    ])
    return crud.create_trip(db, user.id, data)


def stop_names(trip):
    return [stop.place.name for stop in trip.stops]


# --- Places ----------------------------------------------------------------


def test_create_and_get_place(db, places):
    place = crud.get_place(db, places["park"].id)
    assert place.name == "Balboa Park"
    assert place.id is not None


def test_get_missing_place_returns_none(db):
    assert crud.get_place(db, 999) is None


def test_get_places_sorted_by_name(db, places):
    names = [p.name for p in crud.get_places(db)]
    assert names == sorted(names)
    assert len(names) == 4


def test_get_places_filters(db, places):
    def names(**filters):
        return {p.name for p in crud.get_places(db, PlaceSearchParams(**filters))}

    assert names(q="coffee") == {"Better Buzz Coffee"}
    assert names(q="museums") == {"Balboa Park"}  # matches the description
    assert names(category=PlaceCategory.PARK) == {"Balboa Park", "Japanese Friendship Garden"}
    assert names(neighborhood="pacific") == {"Better Buzz Coffee"}
    assert names(max_cost=15) == {"Better Buzz Coffee", "Balboa Park"}
    assert names(min_cost=15) == {"The Prado", "Japanese Friendship Garden"}
    assert names(city="Los Angeles") == set()


def test_get_places_pagination(db, places):
    first_two = crud.get_places(db, PlaceSearchParams(limit=2))
    rest = crud.get_places(db, PlaceSearchParams(skip=2, limit=2))
    assert len(first_two) == 2 and len(rest) == 2
    assert not {p.id for p in first_two} & {p.id for p in rest}


def test_update_place_only_changes_sent_fields(db, places):
    updated = crud.update_place(db, places["lunch"].id, PlaceUpdate(estimated_cost=25))
    assert updated.estimated_cost == 25
    assert updated.name == "The Prado"


def test_update_missing_place_returns_none(db):
    assert crud.update_place(db, 999, PlaceUpdate(name="Nope")) is None


def test_delete_place(db, places):
    assert crud.delete_place(db, places["coffee"].id) is True
    assert crud.get_place(db, places["coffee"].id) is None
    assert crud.delete_place(db, places["coffee"].id) is False


# --- Trips -----------------------------------------------------------------


def test_create_trip_with_nested_stops(trip, user):
    assert trip.user_id == user.id
    assert stop_names(trip) == ["Better Buzz Coffee", "Balboa Park", "The Prado"]
    assert [s.position for s in trip.stops] == [1, 2, 3]
    assert trip.estimated_total == 44  # 12 + 0 + 32
    assert trip.remaining_budget == 56


def test_create_trip_with_unknown_place_raises(db, user):
    data = TripCreate(name="Bad trip", stops=[TripStopCreate(place_id=999)])
    with pytest.raises(ValueError):
        crud.create_trip(db, user.id, data)


def test_get_trip_is_limited_to_owner(db, trip, user, other_user):
    assert crud.get_trip(db, trip.id, user.id).id == trip.id
    assert crud.get_trip(db, trip.id).id == trip.id  # no user filter
    assert crud.get_trip(db, trip.id, other_user.id) is None


def test_get_trips_for_user_and_status(db, user, other_user, trip):
    second = crud.create_trip(db, user.id, TripCreate(name="Date Night"))
    crud.create_trip(db, other_user.id, TripCreate(name="Not mine"))
    crud.complete_trip(db, second.id, user.id)

    assert {t.name for t in crud.get_trips(db, user.id)} == {"San Diego Saturday", "Date Night"}
    assert [t.name for t in crud.get_trips(db, user.id, TripStatus.COMPLETED)] == ["Date Night"]
    assert [t.name for t in crud.get_trips(db, user.id, TripStatus.PLANNED)] == ["San Diego Saturday"]


def test_update_trip(db, trip, user, other_user):
    updated = crud.update_trip(db, trip.id, user.id, TripUpdate(name="Sunday Funday", budget=80))
    assert updated.name == "Sunday Funday"
    assert updated.budget == 80
    assert updated.stop_count == 3  # untouched
    assert crud.update_trip(db, trip.id, other_user.id, TripUpdate(name="Hacked")) is None


def test_update_trip_to_completed_sets_completed_at(db, trip, user):
    updated = crud.update_trip(db, trip.id, user.id, TripUpdate(status=TripStatus.COMPLETED))
    assert updated.status == TripStatus.COMPLETED
    assert updated.completed_at is not None


def test_complete_trip(db, trip, user, other_user):
    assert crud.complete_trip(db, trip.id, other_user.id) is None
    completed = crud.complete_trip(db, trip.id, user.id)
    assert completed.status == TripStatus.COMPLETED
    assert completed.completed_at is not None


def test_delete_trip_deletes_its_stops(db, trip, user, other_user):
    assert crud.delete_trip(db, trip.id, other_user.id) is False
    assert crud.delete_trip(db, trip.id, user.id) is True
    assert crud.get_trip(db, trip.id) is None
    assert db.query(TripStop).count() == 0


# --- Trip stops ------------------------------------------------------------


def test_add_stop_appends_to_end(db, trip, user, places):
    stop = crud.add_trip_stop(db, trip.id, user.id, TripStopCreate(place_id=places["garden"].id))
    assert stop.position == 4
    db.expire_all()
    assert stop_names(crud.get_trip(db, trip.id))[-1] == "Japanese Friendship Garden"


def test_add_stop_in_middle_shifts_others(db, trip, user, places):
    crud.add_trip_stop(db, trip.id, user.id, TripStopCreate(place_id=places["garden"].id, position=2))
    db.expire_all()
    reloaded = crud.get_trip(db, trip.id)
    assert stop_names(reloaded) == ["Better Buzz Coffee", "Japanese Friendship Garden", "Balboa Park", "The Prado"]
    assert [s.position for s in reloaded.stops] == [1, 2, 3, 4]


def test_add_stop_errors(db, trip, user, other_user, places):
    with pytest.raises(ValueError):
        crud.add_trip_stop(db, trip.id, other_user.id, TripStopCreate(place_id=places["garden"].id))
    with pytest.raises(ValueError):
        crud.add_trip_stop(db, trip.id, user.id, TripStopCreate(place_id=999))


def test_get_trip_stop(db, trip):
    first = trip.stops[0]
    assert crud.get_trip_stop(db, trip.id, first.id).place.name == "Better Buzz Coffee"
    assert crud.get_trip_stop(db, trip.id + 1, first.id) is None  # wrong trip


def test_update_stop_fields(db, trip):
    lunch = trip.stops[2]
    updated = crud.update_trip_stop(db, trip.id, lunch.id, TripStopUpdate(estimated_cost=20, notes="Split a meal"))
    assert updated.estimated_cost == 20
    assert updated.notes == "Split a meal"
    assert crud.get_trip(db, trip.id).estimated_total == 32  # 12 + 0 + 20


def test_update_stop_position_reorders(db, trip):
    lunch = trip.stops[2]
    crud.update_trip_stop(db, trip.id, lunch.id, TripStopUpdate(position=1))
    db.expire_all()
    reloaded = crud.get_trip(db, trip.id)
    assert stop_names(reloaded) == ["The Prado", "Better Buzz Coffee", "Balboa Park"]
    assert [s.position for s in reloaded.stops] == [1, 2, 3]


def test_update_missing_stop_returns_none(db, trip):
    assert crud.update_trip_stop(db, trip.id, 999, TripStopUpdate(notes="x")) is None


def test_delete_trip_stop(db, trip):
    stop_id = trip.stops[0].id
    assert crud.delete_trip_stop(db, trip.id, stop_id) is True
    assert crud.get_trip_stop(db, trip.id, stop_id) is None
    assert crud.delete_trip_stop(db, trip.id, stop_id) is False
