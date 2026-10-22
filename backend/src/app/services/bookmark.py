# OWNER: Person 3 | Part 3 - Bookmarks service
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Place, User
from app.repository import bookmark as repo
from app.schemas.bookmark import BookmarkCreate, BookmarkUpdate


def check_user(db: Session, user_id: int):
    if not db.get(User, user_id):
        raise HTTPException(404, "User not found")


# show a user's saved places
def list_bookmarks(db: Session, user_id: int):
    check_user(db, user_id)
    return repo.list_for_user(db, user_id)


# prevent saving the same place twice
def create_bookmark(db: Session, user_id: int, data: BookmarkCreate):
    check_user(db, user_id)
    if not db.get(Place, data.place_id):
        raise HTTPException(404, "Place not found")
    if repo.get_for_place(db, user_id, data.place_id):
        raise HTTPException(409, "Place already bookmarked")
    try:
        return repo.create(db, user_id, data.place_id, data.note)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Place already bookmarked")


# only the owner can change the bookmark
def owned_bookmark(db: Session, bookmark_id: int, user_id: int):
    bookmark = repo.get_by_id(db, bookmark_id)
    if not bookmark:
        raise HTTPException(404, "Bookmark not found")
    if bookmark.user_id != user_id:
        raise HTTPException(403, "Not your bookmark")
    return bookmark


def update_bookmark(db: Session, bookmark_id: int, user_id: int, data: BookmarkUpdate):
    bookmark = owned_bookmark(db, bookmark_id, user_id)
    return repo.update(db, bookmark, data.model_dump(exclude_unset=True))


def delete_bookmark(db: Session, bookmark_id: int, user_id: int):
    repo.delete(db, owned_bookmark(db, bookmark_id, user_id))
