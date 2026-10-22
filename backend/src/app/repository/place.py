# ======================================================================
# OWNER:  Arjay Lagera
# PART:   Part 3 - CRUD for Places
# STATUS: FINISHED
# ======================================================================

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import Place
from app.schemas.place import PlaceSearchParams


def get_by_id(db: Session, place_id: int) -> Place | None:
    stmt = (
        select(Place)
        .options(joinedload(Place.reviews))
        .where(Place.id == place_id)
    )
    return db.execute(stmt).unique().scalar_one_or_none()


def list_places(db: Session, params: PlaceSearchParams) -> list[Place]:
    stmt = select(Place).options(joinedload(Place.reviews))

    if params.q:
        text = f"%{params.q.strip()}%"
        stmt = stmt.where(or_(Place.name.ilike(text), Place.description.ilike(text)))
    if params.category is not None:
        stmt = stmt.where(Place.category == params.category)
    if params.neighborhood:
        stmt = stmt.where(Place.neighborhood.ilike(f"%{params.neighborhood}%"))
    if params.city:
        stmt = stmt.where(Place.city.ilike(f"%{params.city}%"))
    if params.min_cost is not None:
        stmt = stmt.where(Place.estimated_cost >= params.min_cost)
    if params.max_cost is not None:
        stmt = stmt.where(Place.estimated_cost <= params.max_cost)

    stmt = stmt.order_by(Place.name).offset(params.skip).limit(params.limit)
    return list(db.execute(stmt).unique().scalars().all())


def create(db: Session, place: Place) -> Place:
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


def update(db: Session, place: Place, values: dict) -> Place:
    for field, value in values.items():
        setattr(place, field, value)
    db.commit()
    db.refresh(place)
    return place


def delete(db: Session, place: Place) -> None:
    db.delete(place)
    db.commit()
