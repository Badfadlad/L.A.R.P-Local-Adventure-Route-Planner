# ======================================================================
# OWNER:  Person 4 (Nutsa)
# PART:   Part 6 - Testing
# STATUS: DONE
# ======================================================================

"""Endpoint tests for /places and /trips.

These exercise the /places and /trips routes and services (Person 2, Parts
3 & 4) end to end through the API.
"""

import pytest

from app.models import Place, PlaceCategory

PLACES = "/api/v1/places"
TRIPS = "/api/v1/trips"


@pytest.fixture()
def place(db):
    place = Place(name="Balboa Park", category=PlaceCategory.PARK, city="San Diego", estimated_cost=0)
    db.add(place)
    db.commit()
    return place


# --- /places -------------------------------------------------------------


def test_create_place(client):
    response = client.post(PLACES, json={"name": "Sunset Cliffs", "category": "viewpoint", "city": "San Diego"})
    assert response.status_code == 201
    assert response.json()["name"] == "Sunset Cliffs"


def test_list_places(client, place):
    response = client.get(PLACES, params={"category": "park"})
    assert response.status_code == 200
    assert [p["name"] for p in response.json()] == ["Balboa Park"]


def test_get_place(client, place):
    response = client.get(f"{PLACES}/{place.id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Balboa Park"


def test_get_missing_place_is_404(client):
    assert client.get(f"{PLACES}/999").status_code == 404


def test_update_place(client, place):
    response = client.patch(f"{PLACES}/{place.id}", json={"estimated_cost": 5})
    assert response.status_code == 200
    assert response.json()["estimated_cost"] == 5


def test_delete_place(client, place):
    assert client.delete(f"{PLACES}/{place.id}").status_code == 204
    assert client.get(f"{PLACES}/{place.id}").status_code == 404


# --- /trips --------------------------------------------------------------
# The trip routes still take a temporary `?user_id=` query parameter
# instead of the login token.


def test_create_and_get_trip(client, user, place):
    created = client.post(TRIPS, params={"user_id": user.id}, json={
        "name": "San Diego Saturday", "budget": 100, "stops": [{"place_id": place.id}],
    })
    assert created.status_code == 201
    trip_id = created.json()["id"]

    response = client.get(f"{TRIPS}/{trip_id}", params={"user_id": user.id})
    assert response.status_code == 200
    assert response.json()["stops"][0]["place"]["name"] == "Balboa Park"


def test_list_trips(client, user):
    client.post(TRIPS, params={"user_id": user.id}, json={"name": "Date Night"})
    response = client.get(TRIPS, params={"user_id": user.id})
    assert response.status_code == 200
    assert [t["name"] for t in response.json()] == ["Date Night"]


def test_complete_trip(client, user):
    trip_id = client.post(TRIPS, params={"user_id": user.id}, json={"name": "Date Night"}).json()["id"]
    response = client.post(f"{TRIPS}/{trip_id}/complete", params={"user_id": user.id})
    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_add_stop_to_trip(client, user, place):
    trip_id = client.post(TRIPS, params={"user_id": user.id}, json={"name": "Date Night"}).json()["id"]
    response = client.post(f"{TRIPS}/{trip_id}/stops", params={"user_id": user.id}, json={"place_id": place.id})
    assert response.status_code == 201
    assert response.json()["position"] == 1


def test_delete_trip(client, user):
    trip_id = client.post(TRIPS, params={"user_id": user.id}, json={"name": "Date Night"}).json()["id"]
    assert client.delete(f"{TRIPS}/{trip_id}", params={"user_id": user.id}).status_code == 204
