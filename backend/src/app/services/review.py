# OWNER: Person 3 | Part 3 - Reviews service
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Place, Trip, User
from app.repository import review as repo
from app.schemas.review import ReviewCreate, ReviewUpdate


# filter reviews by place or user
def list_reviews(db: Session, place_id: int | None = None, user_id: int | None = None):
    return repo.list_reviews(db, place_id, user_id)


# check that the place and optional trip are valid
def create_review(db: Session, user_id: int, data: ReviewCreate):
    if not db.get(User, user_id):
        raise HTTPException(404, "User not found")
    if not db.get(Place, data.place_id):
        raise HTTPException(404, "Place not found")
    if data.trip_id is not None:
        trip = db.get(Trip, data.trip_id)
        if not trip:
            raise HTTPException(404, "Trip not found")
        if trip.user_id != user_id:
            raise HTTPException(403, "Not your trip")
    return repo.create(db, user_id, data.model_dump())


# only the review author can edit or delete it
def owned_review(db: Session, review_id: int, user_id: int):
    review = repo.get_by_id(db, review_id)
    if not review:
        raise HTTPException(404, "Review not found")
    if review.user_id != user_id:
        raise HTTPException(403, "Not your review")
    return review


def update_review(db: Session, review_id: int, user_id: int, data: ReviewUpdate):
    review = owned_review(db, review_id, user_id)
    return repo.update(db, review, data.model_dump(exclude_unset=True))


def delete_review(db: Session, review_id: int, user_id: int):
    repo.delete(db, owned_review(db, review_id, user_id))
