# OWNER: Person 3 | Part 4 - Bookmarks endpoints
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models import User
from app.schemas.bookmark import BookmarkCreate, BookmarkRead, BookmarkUpdate
from app.services import bookmark as service

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


# Temporary until Person 4 adds JWT authentication.
def _user_id(current_user: User = Depends(get_current_user)) -> int:
    return current_user.id


@router.get("", response_model=list[BookmarkRead])
def list_bookmarks(user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return service.list_bookmarks(db, user_id)


@router.post("", response_model=BookmarkRead, status_code=status.HTTP_201_CREATED)
def create_bookmark(data: BookmarkCreate, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return service.create_bookmark(db, user_id, data)


@router.patch("/{bookmark_id}", response_model=BookmarkRead)
def update_bookmark(bookmark_id: int, data: BookmarkUpdate, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return service.update_bookmark(db, bookmark_id, user_id, data)


@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(bookmark_id: int, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    service.delete_bookmark(db, bookmark_id, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
