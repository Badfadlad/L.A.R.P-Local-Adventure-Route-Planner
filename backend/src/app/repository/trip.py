# ======================================================================
# OWNER:  Arjay Lagera
# PART:   Part 3 - CRUD for Trips
# STATUS: FINISHED
# ======================================================================
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Place, Trip, TripStop, TripStatus


def _trip_query():
    return select(Trip).options(
        joinedload(Trip.stops).joinedload(TripStop.place),
        joinedload(Trip.reviews),
    )


def get_by_id(db: Session, trip_id: int, user_id: int | None = None) -> Trip | None:
    stmt = _trip_query().where(Trip.id == trip_id)
    if user_id is not None:
        stmt = stmt.where(Trip.user_id == user_id)
    return db.execute(stmt).unique().scalar_one_or_none()


def list_by_user(db: Session, user_id: int, status: TripStatus | None = None) -> list[Trip]:
    stmt = _trip_query().where(Trip.user_id == user_id).order_by(Trip.created_at.desc())
    if status is not None:
        stmt = stmt.where(Trip.status == status)
    return list(db.execute(stmt).unique().scalars().all())


def create(db: Session, trip: Trip) -> Trip:
    db.add(trip)
    db.commit()
    return get_by_id(db, trip.id, trip.user_id)


def update(db: Session, trip: Trip, values: dict) -> Trip:
    for field, value in values.items():
        setattr(trip, field, value)
    db.commit()
    return get_by_id(db, trip.id, trip.user_id)


def delete(db: Session, trip: Trip) -> None:
    db.delete(trip)
    db.commit()


def get_place(db: Session, place_id: int) -> Place | None:
    return db.get(Place, place_id)


def add_stop(db: Session, stop: TripStop) -> TripStop:
    db.add(stop)
    db.commit()
    db.refresh(stop)
    return stop


def get_stop(db: Session, trip_id: int, stop_id: int) -> TripStop | None:
    stmt = (
        select(TripStop)
        .options(joinedload(TripStop.place))
        .where(TripStop.id == stop_id, TripStop.trip_id == trip_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def delete_stop(db: Session, stop: TripStop) -> None:
    db.delete(stop)
    db.commit()


def save(db: Session) -> None:
    db.commit()
