# ======================================================================
# OWNER:  Person 4 (Nutsa)
# PART:   Part 6 - Testing
# STATUS: DONE
# ======================================================================

"""Unit tests for Arjay's place + trip repository and service functions.

These call the functions directly with the `db` fixture instead of going
through HTTP, so a failure points straight at the repository/service code.
"""

import pytest
from fastapi import HTTPException

from app.models import Place, PlaceCategory, Trip, TripStatus, TripStop, User
from app.repository import place as place_repo
from app.repository import trip as trip_repo
from app.schemas.place import PlaceCreate, PlaceSearchParams, PlaceUpdate
from app.schemas.trip import TripCreate, TripStopCreate, TripStopReorder, TripStopUpdate, TripUpdate
from app.services import place as place_service
from app.services import trip as trip_service


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
    return {key: place_service.create_place(db, value) for key, value in data.items()}


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
    return trip_service.create_trip(db, user.id, data)


def stop_names(trip):
    return [stop.place.name for stop in trip.stops]


def stop_ids(trip):
    return [stop.id for stop in trip.stops]


def assert_404(func, *args):
    with pytest.raises(HTTPException) as error:
        func(*args)
    assert error.value.status_code == 404


# --- repository/place.py -------------------------------------------------


def test_place_repo_create_and_get(db):
    place = place_repo.create(db, Place(name="Sunset Cliffs", category=PlaceCategory.VIEWPOINT, city="San Diego"))
    assert place.id is not None
    found = place_repo.get_by_id(db, place.id)
    assert found.name == "Sunset Cliffs"
    assert found.estimated_cost == 0  # model default


def test_place_repo_get_missing_returns_none(db):
    assert place_repo.get_by_id(db, 999) is None


def test_place_repo_update_and_delete(db, places):
    place = place_repo.update(db, places["lunch"], {"estimated_cost": 40, "subcategory": "Spanish"})
    assert place.estimated_cost == 40
    assert place.subcategory == "Spanish"

    place_repo.delete(db, place)
    assert place_repo.get_by_id(db, places["lunch"].id) is None


# --- services/place.py: list + filters -----------------------------------


def names(places):
    return [place.name for place in places]


def test_list_places_sorted_by_name(db, places):
    result = names(place_service.list_places(db, PlaceSearchParams()))
    assert result == sorted(result)
    assert len(result) == 4


def test_list_places_text_search_matches_name_and_description(db, places):
    assert names(place_service.list_places(db, PlaceSearchParams(q="coffee"))) == ["Better Buzz Coffee"]
    # "museums" is only in Balboa Park's description
    assert names(place_service.list_places(db, PlaceSearchParams(q="  MUSEUMS "))) == ["Balboa Park"]


def test_list_places_by_category(db, places):
    result = names(place_service.list_places(db, PlaceSearchParams(category=PlaceCategory.PARK)))
    assert result == ["Balboa Park", "Japanese Friendship Garden"]


def test_list_places_by_neighborhood_and_city(db, places):
    assert names(place_service.list_places(db, PlaceSearchParams(neighborhood="pacific"))) == ["Better Buzz Coffee"]
    assert len(place_service.list_places(db, PlaceSearchParams(city="san diego"))) == 4
    assert place_service.list_places(db, PlaceSearchParams(city="Los Angeles")) == []


def test_list_places_by_cost_range(db, places):
    under_15 = names(place_service.list_places(db, PlaceSearchParams(max_cost=15)))
    assert under_15 == ["Balboa Park", "Better Buzz Coffee"]
    between = names(place_service.list_places(db, PlaceSearchParams(min_cost=12, max_cost=16)))
    assert between == ["Better Buzz Coffee", "Japanese Friendship Garden"]


def test_list_places_combined_filters(db, places):
    params = PlaceSearchParams(category=PlaceCategory.PARK, neighborhood="Balboa", min_cost=1)
    assert names(place_service.list_places(db, params)) == ["Japanese Friendship Garden"]


def test_list_places_skip_and_limit(db, places):
    everything = names(place_service.list_places(db, PlaceSearchParams()))
    page = names(place_service.list_places(db, PlaceSearchParams(skip=1, limit=2)))
    assert page == everything[1:3]


# --- services/place.py: get / update / delete ----------------------------


def test_get_place(db, places):
    assert place_service.get_place(db, places["park"].id).name == "Balboa Park"


def test_get_missing_place_raises_404(db):
    assert_404(place_service.get_place, db, 999)


def test_update_place_only_changes_given_fields(db, places):
    place = place_service.update_place(db, places["coffee"].id, PlaceUpdate(estimated_cost=8))
    assert place.estimated_cost == 8
    assert place.name == "Better Buzz Coffee"
    assert place.neighborhood == "Pacific Beach"


def test_update_missing_place_raises_404(db):
    assert_404(place_service.update_place, db, 999, PlaceUpdate(name="Nope"))


def test_delete_place(db, places):
    place_service.delete_place(db, places["garden"].id)
    assert_404(place_service.get_place, db, places["garden"].id)
    assert len(place_service.list_places(db, PlaceSearchParams())) == 3


def test_delete_missing_place_raises_404(db):
    assert_404(place_service.delete_place, db, 999)


# --- repository/trip.py --------------------------------------------------


def test_trip_repo_create_and_get(db, user, places):
    trip = Trip(user_id=user.id, name="Quick Walk")
    trip.stops.append(TripStop(place=places["park"], position=1))
    trip = trip_repo.create(db, trip)

    assert trip.id is not None
    assert trip.status == TripStatus.PLANNED
    assert stop_names(trip_repo.get_by_id(db, trip.id)) == ["Balboa Park"]


def test_trip_repo_get_by_id_checks_owner(db, trip, user, other_user):
    assert trip_repo.get_by_id(db, trip.id, user.id) is not None
    assert trip_repo.get_by_id(db, trip.id, other_user.id) is None
    assert trip_repo.get_by_id(db, 999) is None


def test_trip_repo_list_by_user_and_status(db, trip, user, other_user):
    trip_repo.create(db, Trip(user_id=user.id, name="Done Trip", status=TripStatus.COMPLETED))
    trip_repo.create(db, Trip(user_id=other_user.id, name="Not Mine"))

    assert {t.name for t in trip_repo.list_by_user(db, user.id)} == {"San Diego Saturday", "Done Trip"}
    assert [t.name for t in trip_repo.list_by_user(db, user.id, TripStatus.COMPLETED)] == ["Done Trip"]
    assert [t.name for t in trip_repo.list_by_user(db, user.id, TripStatus.PLANNED)] == ["San Diego Saturday"]


def test_trip_repo_update_and_delete(db, trip, user):
    updated = trip_repo.update(db, trip, {"name": "Renamed", "budget": 50})
    assert updated.name == "Renamed"
    assert updated.budget == 50

    trip_repo.delete(db, updated)
    assert trip_repo.get_by_id(db, trip.id) is None
    assert db.query(TripStop).count() == 0  # stops are deleted with the trip


def test_trip_repo_get_place(db, places):
    assert trip_repo.get_place(db, places["park"].id).name == "Balboa Park"
    assert trip_repo.get_place(db, 999) is None


def test_trip_repo_stop_add_get_delete(db, trip, places):
    stop = trip_repo.add_stop(db, TripStop(trip_id=trip.id, place_id=places["garden"].id, position=4))
    assert trip_repo.get_stop(db, trip.id, stop.id).place.name == "Japanese Friendship Garden"

    trip_repo.delete_stop(db, stop)
    assert trip_repo.get_stop(db, trip.id, stop.id) is None


def test_trip_repo_get_stop_from_another_trip_returns_none(db, trip, user):
    other = trip_repo.create(db, Trip(user_id=user.id, name="Other"))
    assert trip_repo.get_stop(db, other.id, trip.stops[0].id) is None


# --- services/trip.py: trips ---------------------------------------------


def test_create_trip_with_stops_in_order(db, trip, user):
    assert trip.user_id == user.id
    assert stop_names(trip) == ["Better Buzz Coffee", "Balboa Park", "The Prado"]
    assert [stop.position for stop in trip.stops] == [1, 2, 3]
    assert trip.estimated_total == 44
    assert trip.remaining_budget == 56


def test_create_trip_with_explicit_positions(db, user, places):
    data = TripCreate(name="Backwards", stops=[
        TripStopCreate(place_id=places["coffee"].id, position=2),
        TripStopCreate(place_id=places["park"].id, position=1),
    ])
    trip = trip_service.create_trip(db, user.id, data)
    assert stop_names(trip) == ["Balboa Park", "Better Buzz Coffee"]


def test_create_trip_with_missing_place_raises_404(db, user):
    data = TripCreate(name="Bad", stops=[TripStopCreate(place_id=999)])
    assert_404(trip_service.create_trip, db, user.id, data)
    assert db.query(Trip).count() == 0


def test_list_trips(db, trip, user, other_user):
    assert [t.id for t in trip_service.list_trips(db, user.id)] == [trip.id]
    assert trip_service.list_trips(db, other_user.id) == []
    assert trip_service.list_trips(db, user.id, TripStatus.COMPLETED) == []


def test_get_trip(db, trip, user):
    assert trip_service.get_trip(db, trip.id, user.id).name == "San Diego Saturday"


def test_get_missing_or_other_users_trip_raises_404(db, trip, other_user, user):
    assert_404(trip_service.get_trip, db, 999, user.id)
    assert_404(trip_service.get_trip, db, trip.id, other_user.id)


def test_update_trip_only_changes_given_fields(db, trip, user):
    updated = trip_service.update_trip(db, trip.id, user.id, TripUpdate(name="Sunday Funday"))
    assert updated.name == "Sunday Funday"
    assert updated.budget == 100
    assert updated.status == TripStatus.PLANNED
    assert updated.completed_at is None


def test_update_trip_to_completed_sets_completed_at(db, trip, user):
    updated = trip_service.update_trip(db, trip.id, user.id, TripUpdate(status=TripStatus.COMPLETED))
    assert updated.status == TripStatus.COMPLETED
    assert updated.completed_at is not None


def test_update_other_users_trip_raises_404(db, trip, other_user):
    assert_404(trip_service.update_trip, db, trip.id, other_user.id, TripUpdate(name="Mine now"))


def test_complete_trip(db, trip, user):
    completed = trip_service.complete_trip(db, trip.id, user.id)
    assert completed.status == TripStatus.COMPLETED
    assert completed.completed_at is not None
    assert [t.id for t in trip_service.list_trips(db, user.id, TripStatus.COMPLETED)] == [trip.id]


def test_complete_missing_trip_raises_404(db, user):
    assert_404(trip_service.complete_trip, db, 999, user.id)


def test_delete_trip(db, trip, user):
    trip_service.delete_trip(db, trip.id, user.id)
    assert_404(trip_service.get_trip, db, trip.id, user.id)
    assert db.query(TripStop).count() == 0


def test_delete_other_users_trip_raises_404(db, trip, other_user, user):
    assert_404(trip_service.delete_trip, db, trip.id, other_user.id)
    assert trip_service.get_trip(db, trip.id, user.id) is not None


# --- services/trip.py: stops ---------------------------------------------


def test_add_stop_appends_to_end(db, trip, user, places):
    stop = trip_service.add_stop(db, trip.id, user.id, TripStopCreate(place_id=places["garden"].id))
    assert stop.position == 4
    trip = trip_service.get_trip(db, trip.id, user.id)
    assert stop_names(trip)[-1] == "Japanese Friendship Garden"


def test_add_stop_at_position_shifts_later_stops(db, trip, user, places):
    trip_service.add_stop(db, trip.id, user.id, TripStopCreate(place_id=places["garden"].id, position=2))
    trip = trip_service.get_trip(db, trip.id, user.id)
    assert stop_names(trip) == ["Better Buzz Coffee", "Japanese Friendship Garden", "Balboa Park", "The Prado"]
    assert [stop.position for stop in trip.stops] == [1, 2, 3, 4]


def test_add_stop_with_cost_override(db, trip, user, places):
    stop = trip_service.add_stop(
        db, trip.id, user.id, TripStopCreate(place_id=places["garden"].id, estimated_cost=5, notes="Student discount")
    )
    assert stop.cost == 5
    assert stop.notes == "Student discount"
    assert trip_service.get_trip(db, trip.id, user.id).estimated_total == 49


def test_add_stop_missing_place_or_trip_raises_404(db, trip, user, other_user, places):
    assert_404(trip_service.add_stop, db, trip.id, user.id, TripStopCreate(place_id=999))
    assert_404(trip_service.add_stop, db, trip.id, other_user.id, TripStopCreate(place_id=places["garden"].id))


def test_update_stop_fields(db, trip, user):
    stop_id = trip.stops[0].id
    stop = trip_service.update_stop(
        db, trip.id, stop_id, user.id, TripStopUpdate(duration_minutes=30, estimated_cost=6, notes="Get a latte")
    )
    assert stop.duration_minutes == 30
    assert stop.cost == 6
    assert stop.notes == "Get a latte"
    assert stop.position == 1


def test_update_stop_position_moves_it(db, trip, user):
    coffee_id = trip.stops[0].id
    trip_service.update_stop(db, trip.id, coffee_id, user.id, TripStopUpdate(position=3))
    trip = trip_service.get_trip(db, trip.id, user.id)
    assert stop_names(trip) == ["Balboa Park", "The Prado", "Better Buzz Coffee"]
    assert [stop.position for stop in trip.stops] == [1, 2, 3]


def test_update_stop_position_past_end_moves_it_last(db, trip, user):
    coffee_id = trip.stops[0].id
    trip_service.update_stop(db, trip.id, coffee_id, user.id, TripStopUpdate(position=10))
    trip = trip_service.get_trip(db, trip.id, user.id)
    assert stop_names(trip)[-1] == "Better Buzz Coffee"
    assert [stop.position for stop in trip.stops] == [1, 2, 3]


def test_update_missing_stop_raises_404(db, trip, user):
    assert_404(trip_service.update_stop, db, trip.id, 999, user.id, TripStopUpdate(notes="x"))


def test_reorder_stops(db, trip, user):
    coffee, park, lunch = stop_ids(trip)
    reordered = trip_service.reorder_stops(db, trip.id, user.id, TripStopReorder(stop_ids=[lunch, coffee, park]))
    assert stop_names(reordered) == ["The Prado", "Better Buzz Coffee", "Balboa Park"]
    assert [stop.position for stop in reordered.stops] == [1, 2, 3]


@pytest.mark.parametrize("pick", [
    lambda ids: ids[:2],                 # missing a stop
    lambda ids: ids + [999],             # unknown stop id
    lambda ids: [ids[0], ids[0], ids[1]],  # duplicate, missing one
    lambda ids: ids + [ids[0]],          # duplicate on top of every stop
])
def test_reorder_stops_needs_every_stop_exactly_once(db, trip, user, pick):
    with pytest.raises(HTTPException) as error:
        trip_service.reorder_stops(db, trip.id, user.id, TripStopReorder(stop_ids=pick(stop_ids(trip))))
    assert error.value.status_code == 400


def test_reorder_other_users_trip_raises_404(db, trip, other_user):
    assert_404(trip_service.reorder_stops, db, trip.id, other_user.id, TripStopReorder(stop_ids=stop_ids(trip)))


def test_delete_stop(db, trip, user):
    park_id = trip.stops[1].id
    trip_service.delete_stop(db, trip.id, park_id, user.id)
    trip = trip_service.get_trip(db, trip.id, user.id)
    assert stop_names(trip) == ["Better Buzz Coffee", "The Prado"]


def test_delete_missing_stop_raises_404(db, trip, user, other_user):
    assert_404(trip_service.delete_stop, db, trip.id, 999, user.id)
    assert_404(trip_service.delete_stop, db, trip.id, trip.stops[0].id, other_user.id)
