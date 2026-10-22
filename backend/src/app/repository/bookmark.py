# OWNER: Person 3 | Part 3 - Bookmarks repository
from sqlalchemy.orm import Session
from app.models import Bookmark


# get bookmarks belonging to one user
def list_for_user(db: Session, user_id: int):
    return db.query(Bookmark).filter(Bookmark.user_id == user_id).all()


def get_by_id(db: Session, bookmark_id: int):
    return db.get(Bookmark, bookmark_id)


def get_for_place(db: Session, user_id: int, place_id: int):
    return db.query(Bookmark).filter(
        Bookmark.user_id == user_id,
        Bookmark.place_id == place_id,
    ).first()


# create, update, and delete bookmarks
def create(db: Session, user_id: int, place_id: int, note: str | None):
    bookmark = Bookmark(user_id=user_id, place_id=place_id, note=note)
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


def update(db: Session, bookmark: Bookmark, changes: dict):
    for field, value in changes.items():
        setattr(bookmark, field, value)
    db.commit()
    db.refresh(bookmark)
    return bookmark


def delete(db: Session, bookmark: Bookmark):
    db.delete(bookmark)
    db.commit()
