# ======================================================================
# OWNER:  Arjay Lagera
# PART:   Part 3 - Business logic for Trips
# STATUS: FINISHED
# ======================================================================

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Trip, TripStatus, TripStop
from app.repository import trip as trip_repo
from app.schemas.trip import TripCreate, TripStopCreate, TripStopReorder, TripStopUpdate, TripUpdate


def _owned_trip(db: Session, trip_id: int, user_id: int) -> Trip:
    trip = trip_repo.get_by_id(db, trip_id, user_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def list_trips(db: Session, user_id: int, status: TripStatus | None = None):
    return trip_repo.list_by_user(db, user_id, status)


def get_trip(db: Session, trip_id: int, user_id: int):
    return _owned_trip(db, trip_id, user_id)


def create_trip(db: Session, user_id: int, data: TripCreate):
    trip = Trip(user_id=user_id, **data.model_dump(exclude={"stops"}))
    for index, stop_data in enumerate(data.stops, start=1):
        place = trip_repo.get_place(db, stop_data.place_id)
        if place is None:
            raise HTTPException(status_code=404, detail=f"Place {stop_data.place_id} not found")
        values = stop_data.model_dump(exclude={"place_id", "position"})
        trip.stops.append(TripStop(place=place, position=stop_data.position or index, **values))
    return trip_repo.create(db, trip)


def update_trip(db: Session, trip_id: int, user_id: int, data: TripUpdate):
    trip = _owned_trip(db, trip_id, user_id)
    values = data.model_dump(exclude_unset=True)
    if values.get("status") == TripStatus.COMPLETED and trip.status != TripStatus.COMPLETED:
        trip.completed_at = datetime.now(timezone.utc)
    return trip_repo.update(db, trip, values)


def delete_trip(db: Session, trip_id: int, user_id: int):
    trip = _owned_trip(db, trip_id, user_id)
    trip_repo.delete(db, trip)


def complete_trip(db: Session, trip_id: int, user_id: int):
    trip = _owned_trip(db, trip_id, user_id)
    trip.status = TripStatus.COMPLETED
    trip.completed_at = datetime.now(timezone.utc)
    return trip_repo.update(db, trip, {})


def add_stop(db: Session, trip_id: int, user_id: int, data: TripStopCreate):
    trip = _owned_trip(db, trip_id, user_id)
    place = trip_repo.get_place(db, data.place_id)
    if place is None:
        raise HTTPException(status_code=404, detail="Place not found")
    next_position = max((stop.position for stop in trip.stops), default=0) + 1
    position = data.position or next_position
    for stop in trip.stops:
        if stop.position >= position:
            stop.position += 1
    values = data.model_dump(exclude={"place_id", "position"})
    stop = TripStop(trip_id=trip.id, place_id=place.id, position=position, **values)
    return trip_repo.add_stop(db, stop)


def update_stop(db: Session, trip_id: int, stop_id: int, user_id: int, data: TripStopUpdate):
    trip = _owned_trip(db, trip_id, user_id)
    stop = trip_repo.get_stop(db, trip.id, stop_id)
    if stop is None:
        raise HTTPException(status_code=404, detail="Trip stop not found")
    values = data.model_dump(exclude_unset=True)
    new_position = values.pop("position", None)
    for field, value in values.items():
        setattr(stop, field, value)
    if new_position is not None and new_position != stop.position:
        ordered = sorted(trip.stops, key=lambda item: item.position)
        ordered.remove(stop)
        ordered.insert(min(new_position, len(ordered) + 1) - 1, stop)
        for index, item in enumerate(ordered, start=1):
            item.position = index
    trip_repo.save(db)
    return trip_repo.get_stop(db, trip.id, stop.id)


def delete_stop(db: Session, trip_id: int, stop_id: int, user_id: int):
    trip = _owned_trip(db, trip_id, user_id)
    stop = trip_repo.get_stop(db, trip.id, stop_id)
    if stop is None:
        raise HTTPException(status_code=404, detail="Trip stop not found")
    trip_repo.delete_stop(db, stop)


def reorder_stops(db: Session, trip_id: int, user_id: int, data: TripStopReorder):
    trip = _owned_trip(db, trip_id, user_id)
    stops = {stop.id: stop for stop in trip.stops}
    if set(data.stop_ids) != set(stops) or len(data.stop_ids) != len(stops):
        raise HTTPException(status_code=400, detail="stop_ids must contain every stop exactly once")
    for position, stop_id in enumerate(data.stop_ids, start=1):
        stops[stop_id].position = position
    trip_repo.save(db)
    return trip_repo.get_by_id(db, trip.id, user_id)
