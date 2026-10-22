# ======================================================================
# OWNER:  Person 4 (Nutsa)
# PART:   Part 6 - Testing
# STATUS: DONE
# ======================================================================

"""Endpoint tests for /places, /trips, /users, /bookmarks and /reviews.

These exercise the routes and services of Person 2 (places, trips) and
Person 3 (users, bookmarks, reviews) end to end through the API.
"""

import pytest

from app.core.auth import create_access_token
from app.models import Place, PlaceCategory, User

PLACES = "/api/v1/places"
TRIPS = "/api/v1/trips"
USERS = "/api/v1/users"
BOOKMARKS = "/api/v1/bookmarks"
REVIEWS = "/api/v1/reviews"


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


def test_create_and_get_trip(client, auth_headers, place):
    created = client.post(TRIPS, headers=auth_headers, json={
        "name": "San Diego Saturday", "budget": 100, "stops": [{"place_id": place.id}],
    })
    assert created.status_code == 201
    trip_id = created.json()["id"]

    response = client.get(f"{TRIPS}/{trip_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["stops"][0]["place"]["name"] == "Balboa Park"


def test_list_trips(client, auth_headers):
    client.post(TRIPS, headers=auth_headers, json={"name": "Date Night"})
    response = client.get(TRIPS, headers=auth_headers)
    assert response.status_code == 200
    assert [t["name"] for t in response.json()] == ["Date Night"]


def test_complete_trip(client, auth_headers):
    trip_id = client.post(TRIPS, headers=auth_headers, json={"name": "Date Night"}).json()["id"]
    response = client.post(f"{TRIPS}/{trip_id}/complete", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_add_stop_to_trip(client, auth_headers, place):
    trip_id = client.post(TRIPS, headers=auth_headers, json={"name": "Date Night"}).json()["id"]
    response = client.post(f"{TRIPS}/{trip_id}/stops", headers=auth_headers, json={"place_id": place.id})
    assert response.status_code == 201
    assert response.json()["position"] == 1


def test_delete_trip(client, auth_headers):
    trip_id = client.post(TRIPS, headers=auth_headers, json={"name": "Date Night"}).json()["id"]
    assert client.delete(f"{TRIPS}/{trip_id}", headers=auth_headers).status_code == 204


# --- /users, /bookmarks, /reviews ------------------------------------------


@pytest.fixture()
def other_user(db):
    user = User(username="mitchell", email="mitchell@example.com", hashed_password="fake-hash")
    db.add(user)
    db.commit()
    return user


@pytest.fixture()
def other_headers(other_user):
    """Headers that make a request look like it comes from `other_user`."""
    token = create_access_token({"sub": str(other_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def bookmark_id(client, auth_headers, place):
    response = client.post(BOOKMARKS, headers=auth_headers, json={"place_id": place.id, "note": "Go early"})
    return response.json()["id"]


@pytest.fixture()
def review_id(client, auth_headers, place):
    response = client.post(REVIEWS, headers=auth_headers, json={"place_id": place.id, "rating": 4})
    return response.json()["id"]


# /users


def test_register_user(client):
    response = client.post(USERS, json={"username": "anay", "email": "anay@example.com", "password": "password123"})
    assert response.status_code == 201
    assert response.json()["username"] == "anay"
    assert "password" not in response.json()
    assert "hashed_password" not in response.json()


def test_register_duplicate_username_is_409(client, user):
    response = client.post(USERS, json={"username": "nutsa", "email": "new@example.com", "password": "password123"})
    assert response.status_code == 409


def test_register_invalid_body_is_422(client):
    response = client.post(USERS, json={"username": "ab", "email": "not-an-email", "password": "short"})
    assert response.status_code == 422


def test_my_profile(client, auth_headers, bookmark_id, review_id):
    response = client.get(f"{USERS}/me", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "nutsa"
    assert body["bookmark_count"] == 1
    assert body["review_count"] == 1
    assert body["trip_count"] == 0
    assert "hashed_password" not in body


def test_edit_profile(client, auth_headers):
    response = client.patch(f"{USERS}/me", headers=auth_headers, json={"home_city": "San Diego, CA"})
    assert response.status_code == 200
    assert response.json()["home_city"] == "San Diego, CA"


def test_edit_profile_email_taken_is_409(client, auth_headers, other_user):
    response = client.patch(f"{USERS}/me", headers=auth_headers, json={"email": other_user.email})
    assert response.status_code == 409


def test_delete_profile(client, auth_headers, user):
    assert client.delete(f"{USERS}/me", headers=auth_headers).status_code == 204
    assert client.get(f"{USERS}/{user.id}").status_code == 404


def test_view_user(client, other_user):
    response = client.get(f"{USERS}/{other_user.id}")
    assert response.status_code == 200
    assert response.json()["username"] == "mitchell"


def test_view_missing_user_is_404(client):
    assert client.get(f"{USERS}/999").status_code == 404


# /bookmarks


def test_create_and_list_bookmarks(client, auth_headers, bookmark_id):
    response = client.get(BOOKMARKS, headers=auth_headers)
    assert response.status_code == 200
    assert [b["id"] for b in response.json()] == [bookmark_id]
    assert response.json()[0]["place"]["name"] == "Balboa Park"


def test_bookmark_same_place_twice_is_409(client, auth_headers, place, bookmark_id):
    response = client.post(BOOKMARKS, headers=auth_headers, json={"place_id": place.id})
    assert response.status_code == 409


def test_bookmark_missing_place_is_404(client, auth_headers):
    response = client.post(BOOKMARKS, headers=auth_headers, json={"place_id": 999})
    assert response.status_code == 404


def test_update_bookmark(client, auth_headers, bookmark_id):
    response = client.patch(f"{BOOKMARKS}/{bookmark_id}", headers=auth_headers, json={"note": "Sunset"})
    assert response.status_code == 200
    assert response.json()["note"] == "Sunset"


def test_update_other_headerss_bookmark_is_403(client, bookmark_id, other_headers):
    response = client.patch(f"{BOOKMARKS}/{bookmark_id}", headers=other_headers, json={"note": "Mine"})
    assert response.status_code == 403


def test_delete_bookmark(client, auth_headers, bookmark_id):
    assert client.delete(f"{BOOKMARKS}/{bookmark_id}", headers=auth_headers).status_code == 204
    assert client.get(BOOKMARKS, headers=auth_headers).json() == []


def test_delete_missing_bookmark_is_404(client, auth_headers):
    assert client.delete(f"{BOOKMARKS}/999", headers=auth_headers).status_code == 404


# /reviews


def test_create_review(client, auth_headers, place, review_id):
    response = client.get(REVIEWS, params={"place_id": place.id})
    assert response.status_code == 200
    assert [r["id"] for r in response.json()] == [review_id]
    assert response.json()[0]["rating"] == 4

    place_response = client.get(f"{PLACES}/{place.id}")
    assert place_response.json()["average_rating"] == 4
    assert place_response.json()["review_count"] == 1


def test_create_review_bad_rating_is_422(client, auth_headers, place):
    response = client.post(REVIEWS, headers=auth_headers, json={"place_id": place.id, "rating": 6})
    assert response.status_code == 422


def test_create_review_missing_place_is_404(client, auth_headers):
    response = client.post(REVIEWS, headers=auth_headers, json={"place_id": 999, "rating": 4})
    assert response.status_code == 404


def test_my_reviews(client, auth_headers, review_id, other_headers, place):
    client.post(REVIEWS, headers=other_headers, json={"place_id": place.id, "rating": 2})
    response = client.get(f"{REVIEWS}/mine", headers=auth_headers)
    assert response.status_code == 200
    assert [r["id"] for r in response.json()] == [review_id]
    assert len(client.get(REVIEWS).json()) == 2


def test_update_review(client, auth_headers, review_id):
    response = client.patch(f"{REVIEWS}/{review_id}", headers=auth_headers, json={"comment": "Lovely"})
    assert response.status_code == 200
    assert response.json()["comment"] == "Lovely"
    assert response.json()["rating"] == 4


def test_update_other_headerss_review_is_403(client, review_id, other_headers):
    response = client.patch(f"{REVIEWS}/{review_id}", headers=other_headers, json={"rating": 1})
    assert response.status_code == 403


def test_delete_review(client, auth_headers, review_id):
    assert client.delete(f"{REVIEWS}/{review_id}", headers=auth_headers).status_code == 204
    assert client.get(f"{REVIEWS}/mine", headers=auth_headers).json() == []


def test_delete_missing_review_is_404(client, auth_headers):
    assert client.delete(f"{REVIEWS}/999", headers=auth_headers).status_code == 404


# Login token checks


@pytest.mark.parametrize(("method", "path"), [
    ("get", TRIPS),
    ("post", TRIPS),
    ("get", f"{USERS}/me"),
    ("patch", f"{USERS}/me"),
    ("delete", f"{USERS}/me"),
    ("get", BOOKMARKS),
    ("post", BOOKMARKS),
    ("patch", f"{BOOKMARKS}/1"),
    ("delete", f"{BOOKMARKS}/1"),
    ("get", f"{REVIEWS}/mine"),
    ("post", REVIEWS),
    ("patch", f"{REVIEWS}/1"),
    ("delete", f"{REVIEWS}/1"),
])
def test_protected_routes_need_a_token(client, method, path):
    response = client.request(method, path, json={})
    assert response.status_code == 401


def test_user_id_param_cannot_act_as_another_user(client, auth_headers, other_user):
    # Logged in as nutsa, but asking for mitchell's profile via the old ?user_id= - the token wins
    response = client.get(f"{USERS}/me", headers=auth_headers, params={"user_id": other_user.id})
    assert response.status_code == 200
    assert response.json()["username"] == "nutsa"
