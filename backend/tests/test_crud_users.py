# ======================================================================
# OWNER:  Person 4 (Nutsa)
# PART:   Part 6 - Testing
# STATUS: DONE
# ======================================================================

"""Unit tests for Mitchell's user, bookmark and review repository and service functions.

These call the functions directly with the `db` fixture instead of going
through HTTP, so a failure points straight at the repository/service code.
"""

import pytest
from fastapi import HTTPException

from app.core.auth import verify_password
from app.models import Bookmark, Place, PlaceCategory, Review, Trip, User
from app.repository import bookmark as bookmark_repo
from app.repository import review as review_repo
from app.repository import user as user_repo
from app.schemas.bookmark import BookmarkCreate, BookmarkUpdate
from app.schemas.review import ReviewCreate, ReviewUpdate
from app.schemas.user import UserCreate, UserUpdate
from app.services import bookmark as bookmark_service
from app.services import review as review_service
from app.services import user as user_service


@pytest.fixture()
def other_user(db):
    user = User(username="mitchell", email="mitchell@example.com", hashed_password="fake-hash")
    db.add(user)
    db.commit()
    return user


@pytest.fixture()
def places(db):
    """Two San Diego places, returned as a dict by short name."""
    data = {
        "park": Place(name="Balboa Park", category=PlaceCategory.PARK, city="San Diego"),
        "coffee": Place(name="Better Buzz Coffee", category=PlaceCategory.CAFE, city="San Diego", estimated_cost=12),
    }
    db.add_all(data.values())
    db.commit()
    return data


@pytest.fixture()
def trip(db, user):
    trip = Trip(user_id=user.id, name="San Diego Saturday")
    db.add(trip)
    db.commit()
    return trip


@pytest.fixture()
def bookmark(db, user, places):
    return bookmark_service.create_bookmark(db, user.id, BookmarkCreate(place_id=places["park"].id, note="Go early"))


@pytest.fixture()
def review(db, user, places):
    return review_service.create_review(db, user.id, ReviewCreate(place_id=places["park"].id, rating=4))


def assert_status(code, func, *args):
    with pytest.raises(HTTPException) as error:
        func(*args)
    assert error.value.status_code == code


# --- repository/user.py --------------------------------------------------


def test_user_repo_create_and_get(db):
    user = user_repo.create(db, {"username": "anay", "email": "anay@example.com", "hashed_password": "x"})
    assert user.id is not None
    assert user_repo.get_by_id(db, user.id).username == "anay"
    assert user_repo.get_by_username(db, "anay").id == user.id
    assert user_repo.get_by_email(db, "anay@example.com").id == user.id


def test_user_repo_missing_returns_none(db):
    assert user_repo.get_by_id(db, 999) is None
    assert user_repo.get_by_username(db, "nobody") is None
    assert user_repo.get_by_email(db, "nobody@example.com") is None


def test_user_repo_update_and_delete(db, user):
    updated = user_repo.update(db, user, {"bio": "Loves tacos"})
    assert updated.bio == "Loves tacos"

    user_repo.delete(db, updated)
    assert user_repo.get_by_id(db, user.id) is None


# --- services/user.py ----------------------------------------------------


def test_create_user_hashes_password(db):
    data = UserCreate(username="anay", email="anay@example.com", password="password123", home_city="San Diego")
    user = user_service.create_user(db, data)
    assert user.id is not None
    assert user.home_city == "San Diego"
    assert user.hashed_password != "password123"
    assert verify_password("password123", user.hashed_password)


def test_create_user_duplicate_username_is_409(db, user):
    data = UserCreate(username=user.username, email="new@example.com", password="password123")
    assert_status(409, user_service.create_user, db, data)


def test_create_user_duplicate_email_is_409(db, user):
    data = UserCreate(username="someone_new", email=user.email, password="password123")
    assert_status(409, user_service.create_user, db, data)


def test_get_user(db, user):
    assert user_service.get_user(db, user.id).username == "nutsa"


def test_get_missing_user_is_404(db):
    assert_status(404, user_service.get_user, db, 999)
    assert_status(404, user_service.get_profile, db, 999)


def test_get_profile_counts(db, user, other_user, trip, bookmark, review, places):
    # other_user's records shouldn't be counted
    db.add(Bookmark(user_id=other_user.id, place_id=places["park"].id))
    db.commit()

    profile = user_service.get_profile(db, user.id)
    assert profile["username"] == "nutsa"
    assert profile["trip_count"] == 1
    assert profile["bookmark_count"] == 1
    assert profile["review_count"] == 1
    assert "hashed_password" not in profile


def test_update_user_only_changes_given_fields(db, user):
    updated = user_service.update_user(db, user.id, UserUpdate(bio="Weekend explorer"))
    assert updated.bio == "Weekend explorer"
    assert updated.email == "nutsa@example.com"


def test_update_user_email(db, user):
    updated = user_service.update_user(db, user.id, UserUpdate(email="new@example.com"))
    assert updated.email == "new@example.com"
    # keeping your own email isn't a conflict
    assert user_service.update_user(db, user.id, UserUpdate(email="new@example.com")).email == "new@example.com"


def test_update_user_email_taken_is_409(db, user, other_user):
    assert_status(409, user_service.update_user, db, user.id, UserUpdate(email=other_user.email))


def test_update_user_empty_email_or_password_is_422(db, user):
    assert_status(422, user_service.update_user, db, user.id, UserUpdate(email=None))
    assert_status(422, user_service.update_user, db, user.id, UserUpdate(password=None))


def test_update_user_password(db, user):
    updated = user_service.update_user(db, user.id, UserUpdate(password="new-password-456"))
    assert verify_password("new-password-456", updated.hashed_password)
    assert not verify_password("password123", updated.hashed_password)


def test_update_missing_user_is_404(db):
    assert_status(404, user_service.update_user, db, 999, UserUpdate(bio="x"))


def test_delete_user_removes_their_records(db, user, trip, bookmark, review):
    user_service.delete_user(db, user.id)
    assert_status(404, user_service.get_user, db, user.id)
    assert db.query(Trip).count() == 0
    assert db.query(Bookmark).count() == 0
    assert db.query(Review).count() == 0


def test_delete_missing_user_is_404(db):
    assert_status(404, user_service.delete_user, db, 999)


# --- repository/bookmark.py ----------------------------------------------


def test_bookmark_repo_create_get_and_list(db, user, other_user, places):
    bookmark = bookmark_repo.create(db, user.id, places["park"].id, "Go early")
    bookmark_repo.create(db, other_user.id, places["park"].id, None)

    assert bookmark_repo.get_by_id(db, bookmark.id).note == "Go early"
    assert bookmark_repo.get_for_place(db, user.id, places["park"].id).id == bookmark.id
    assert bookmark_repo.get_for_place(db, user.id, places["coffee"].id) is None
    assert [b.id for b in bookmark_repo.list_for_user(db, user.id)] == [bookmark.id]


def test_bookmark_repo_update_and_delete(db, bookmark):
    assert bookmark_repo.update(db, bookmark, {"note": "Sunset"}).note == "Sunset"
    bookmark_repo.delete(db, bookmark)
    assert bookmark_repo.get_by_id(db, bookmark.id) is None


# --- services/bookmark.py ------------------------------------------------


def test_create_and_list_bookmarks(db, user, other_user, bookmark, places):
    bookmark_service.create_bookmark(db, other_user.id, BookmarkCreate(place_id=places["coffee"].id))
    mine = bookmark_service.list_bookmarks(db, user.id)
    assert [b.place.name for b in mine] == ["Balboa Park"]
    assert mine[0].note == "Go early"


def test_bookmarks_for_missing_user_is_404(db, places):
    assert_status(404, bookmark_service.list_bookmarks, db, 999)
    assert_status(404, bookmark_service.create_bookmark, db, 999, BookmarkCreate(place_id=places["park"].id))


def test_bookmark_missing_place_is_404(db, user):
    assert_status(404, bookmark_service.create_bookmark, db, user.id, BookmarkCreate(place_id=999))


def test_bookmark_same_place_twice_is_409(db, user, bookmark, places):
    assert_status(409, bookmark_service.create_bookmark, db, user.id, BookmarkCreate(place_id=places["park"].id))


def test_two_users_can_bookmark_the_same_place(db, other_user, bookmark, places):
    other = bookmark_service.create_bookmark(db, other_user.id, BookmarkCreate(place_id=places["park"].id))
    assert other.user_id == other_user.id


def test_update_bookmark(db, user, bookmark):
    updated = bookmark_service.update_bookmark(db, bookmark.id, user.id, BookmarkUpdate(note="Bring a picnic"))
    assert updated.note == "Bring a picnic"


def test_update_bookmark_missing_or_not_owner(db, bookmark, other_user, user):
    assert_status(404, bookmark_service.update_bookmark, db, 999, user.id, BookmarkUpdate(note="x"))
    assert_status(403, bookmark_service.update_bookmark, db, bookmark.id, other_user.id, BookmarkUpdate(note="x"))
    assert bookmark_repo.get_by_id(db, bookmark.id).note == "Go early"


def test_delete_bookmark(db, user, bookmark):
    bookmark_service.delete_bookmark(db, bookmark.id, user.id)
    assert bookmark_service.list_bookmarks(db, user.id) == []


def test_delete_bookmark_missing_or_not_owner(db, bookmark, other_user, user):
    assert_status(404, bookmark_service.delete_bookmark, db, 999, user.id)
    assert_status(403, bookmark_service.delete_bookmark, db, bookmark.id, other_user.id)
    assert bookmark_repo.get_by_id(db, bookmark.id) is not None


# --- repository/review.py ------------------------------------------------


def test_review_repo_create_get_and_list_filters(db, user, other_user, places):
    park_review = review_repo.create(db, user.id, {"place_id": places["park"].id, "rating": 5})
    review_repo.create(db, user.id, {"place_id": places["coffee"].id, "rating": 3})
    review_repo.create(db, other_user.id, {"place_id": places["park"].id, "rating": 2})

    assert review_repo.get_by_id(db, park_review.id).rating == 5
    assert review_repo.get_by_id(db, 999) is None
    assert len(review_repo.list_reviews(db)) == 3
    assert len(review_repo.list_reviews(db, place_id=places["park"].id)) == 2
    assert len(review_repo.list_reviews(db, user_id=user.id)) == 2
    assert [r.id for r in review_repo.list_reviews(db, place_id=places["park"].id, user_id=user.id)] == [park_review.id]


def test_review_repo_update_and_delete(db, review):
    assert review_repo.update(db, review, {"comment": "Great gardens"}).comment == "Great gardens"
    review_repo.delete(db, review)
    assert review_repo.get_by_id(db, review.id) is None


# --- services/review.py --------------------------------------------------


def test_create_review_updates_place_rating(db, user, other_user, review, places):
    review_service.create_review(db, other_user.id, ReviewCreate(place_id=places["park"].id, rating=2))
    db.refresh(places["park"])
    assert places["park"].review_count == 2
    assert places["park"].average_rating == 3


def test_create_review_for_own_trip(db, user, trip, places):
    review = review_service.create_review(
        db, user.id, ReviewCreate(place_id=places["park"].id, trip_id=trip.id, rating=5)
    )
    assert review.trip_id == trip.id
    db.refresh(trip)
    assert trip.overall_rating == 5


def test_create_review_missing_user_place_or_trip_is_404(db, user, places):
    assert_status(404, review_service.create_review, db, 999, ReviewCreate(place_id=places["park"].id, rating=4))
    assert_status(404, review_service.create_review, db, user.id, ReviewCreate(place_id=999, rating=4))
    assert_status(404, review_service.create_review, db, user.id,
                  ReviewCreate(place_id=places["park"].id, trip_id=999, rating=4))


def test_create_review_for_other_users_trip_is_403(db, other_user, trip, places):
    data = ReviewCreate(place_id=places["park"].id, trip_id=trip.id, rating=4)
    assert_status(403, review_service.create_review, db, other_user.id, data)
    assert db.query(Review).count() == 0


def test_list_reviews_by_place_and_user(db, user, other_user, review, places):
    review_service.create_review(db, other_user.id, ReviewCreate(place_id=places["coffee"].id, rating=3))
    assert [r.id for r in review_service.list_reviews(db, place_id=places["park"].id)] == [review.id]
    assert [r.id for r in review_service.list_reviews(db, user_id=user.id)] == [review.id]
    assert len(review_service.list_reviews(db)) == 2


def test_update_review_only_changes_given_fields(db, user, review):
    updated = review_service.update_review(db, review.id, user.id, ReviewUpdate(comment="Bring water"))
    assert updated.comment == "Bring water"
    assert updated.rating == 4


def test_update_review_missing_or_not_owner(db, user, other_user, review):
    assert_status(404, review_service.update_review, db, 999, user.id, ReviewUpdate(rating=1))
    assert_status(403, review_service.update_review, db, review.id, other_user.id, ReviewUpdate(rating=1))
    assert review_repo.get_by_id(db, review.id).rating == 4


def test_delete_review(db, user, review):
    review_service.delete_review(db, review.id, user.id)
    assert review_service.list_reviews(db, user_id=user.id) == []


def test_delete_review_missing_or_not_owner(db, user, other_user, review):
    assert_status(404, review_service.delete_review, db, 999, user.id)
    assert_status(403, review_service.delete_review, db, review.id, other_user.id)
    assert review_repo.get_by_id(db, review.id) is not None
