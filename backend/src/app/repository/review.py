# OWNER: Person 3 | Part 3 - Reviews repository
from sqlalchemy.orm import Session
from app.models import Review


# list reviews, optionally for one place or user
def list_reviews(db: Session, place_id: int | None = None, user_id: int | None = None):
    query = db.query(Review)
    if place_id is not None:
        query = query.filter(Review.place_id == place_id)
    if user_id is not None:
        query = query.filter(Review.user_id == user_id)
    return query.all()


def get_by_id(db: Session, review_id: int):
    return db.get(Review, review_id)


# create, update, and delete reviews
def create(db: Session, user_id: int, data: dict):
    review = Review(user_id=user_id, **data)
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def update(db: Session, review: Review, changes: dict):
    for field, value in changes.items():
        setattr(review, field, value)
    db.commit()
    db.refresh(review)
    return review


def delete(db: Session, review: Review):
    db.delete(review)
    db.commit()
