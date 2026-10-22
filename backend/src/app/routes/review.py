# OWNER: Person 3 | Part 4 - Reviews endpoints
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.review import ReviewCreate, ReviewRead, ReviewUpdate
from app.services import review as service

router = APIRouter(prefix="/reviews", tags=["reviews"])


# Temporary until Person 4 adds JWT authentication.
def _user_id(user_id: int = Query(..., description="Temporary ID until authentication is connected")):
    return user_id


@router.get("", response_model=list[ReviewRead])
def list_reviews(place_id: int | None = None, db: Session = Depends(get_db)):
    return service.list_reviews(db, place_id=place_id)


@router.get("/mine", response_model=list[ReviewRead])
def my_reviews(user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return service.list_reviews(db, user_id=user_id)


@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def create_review(data: ReviewCreate, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return service.create_review(db, user_id, data)


@router.patch("/{review_id}", response_model=ReviewRead)
def update_review(review_id: int, data: ReviewUpdate, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return service.update_review(db, review_id, user_id, data)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    service.delete_review(db, review_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
