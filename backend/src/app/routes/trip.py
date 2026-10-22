# ======================================================================
# OWNER:  Arjay Lagera
# PART:   Part 4 - API endpoints for Trips
# STATUS: FINISHED
# ======================================================================

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models import TripStatus
from app.schemas.trip import (
    TripCreate, TripRead, TripStopCreate, TripStopRead, TripStopReorder,
    TripStopUpdate, TripSummary, TripUpdate,
)
from app.services import trip as trip_service

router = APIRouter(prefix="/trips", tags=["trips"])


def _user_id(user_id: int = Query(..., description="Temporary user ID until Part 5 authentication is connected")) -> int:
    return user_id


@router.get("", response_model=list[TripSummary])
def list_trips(
    status_filter: TripStatus | None = Query(default=None, alias="status"),
    user_id: int = Depends(_user_id),
    db: Session = Depends(get_db),
):
    return trip_service.list_trips(db, user_id, status_filter)


@router.get("/{trip_id}", response_model=TripRead)
def get_trip(trip_id: int, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return trip_service.get_trip(db, trip_id, user_id)


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
def create_trip(data: TripCreate, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return trip_service.create_trip(db, user_id, data)


@router.patch("/{trip_id}", response_model=TripRead)
def update_trip(trip_id: int, data: TripUpdate, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return trip_service.update_trip(db, trip_id, user_id, data)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    trip_service.delete_trip(db, trip_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{trip_id}/complete", response_model=TripRead)
def complete_trip(trip_id: int, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return trip_service.complete_trip(db, trip_id, user_id)


@router.post("/{trip_id}/stops", response_model=TripStopRead, status_code=status.HTTP_201_CREATED)
def add_stop(trip_id: int, data: TripStopCreate, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return trip_service.add_stop(db, trip_id, user_id, data)


@router.patch("/{trip_id}/stops/{stop_id}", response_model=TripStopRead)
def update_stop(trip_id: int, stop_id: int, data: TripStopUpdate, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return trip_service.update_stop(db, trip_id, stop_id, user_id, data)


@router.delete("/{trip_id}/stops/{stop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stop(trip_id: int, stop_id: int, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    trip_service.delete_stop(db, trip_id, stop_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{trip_id}/stops/order", response_model=TripRead)
def reorder_stops(trip_id: int, data: TripStopReorder, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return trip_service.reorder_stops(db, trip_id, user_id, data)
