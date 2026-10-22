# ======================================================================
# OWNER:  Arjay Lagera
# PART:   Part 4 - API endpoints for Places
# STATUS: FINISHED
# ======================================================================

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.place import PlaceCreate, PlaceRead, PlaceSearchParams, PlaceUpdate
from app.services import place as place_service

router = APIRouter(prefix="/places", tags=["places"])


@router.get("", response_model=list[PlaceRead])
def list_places(params: PlaceSearchParams = Depends(), db: Session = Depends(get_db)):
    return place_service.list_places(db, params)


@router.get("/{place_id}", response_model=PlaceRead)
def get_place(place_id: int, db: Session = Depends(get_db)):
    return place_service.get_place(db, place_id)


@router.post("", response_model=PlaceRead, status_code=status.HTTP_201_CREATED)
def create_place(data: PlaceCreate, db: Session = Depends(get_db)):
    return place_service.create_place(db, data)


@router.patch("/{place_id}", response_model=PlaceRead)
def update_place(place_id: int, data: PlaceUpdate, db: Session = Depends(get_db)):
    return place_service.update_place(db, place_id, data)


@router.delete("/{place_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_place(place_id: int, db: Session = Depends(get_db)):
    place_service.delete_place(db, place_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
