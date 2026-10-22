# ======================================================================
# OWNER:  Arjay Lagera
# PART:   Part 3 - Business logic for Places
# STATUS: FINISHED
# ======================================================================

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Place
from app.repository import place as place_repo
from app.schemas.place import PlaceCreate, PlaceSearchParams, PlaceUpdate


def list_places(db: Session, params: PlaceSearchParams):
    return place_repo.list_places(db, params)


def get_place(db: Session, place_id: int):
    place = place_repo.get_by_id(db, place_id)
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    return place


def create_place(db: Session, data: PlaceCreate):
    place = Place(**data.model_dump())
    return place_repo.create(db, place)


def update_place(db: Session, place_id: int, data: PlaceUpdate):
    place = get_place(db, place_id)
    return place_repo.update(db, place, data.model_dump(exclude_unset=True))


def delete_place(db: Session, place_id: int):
    place = get_place(db, place_id)
    place_repo.delete(db, place)
