# OWNER: Person 3 | Part 4 - Users endpoints
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.user import UserCreate, UserProfile, UserRead, UserUpdate
from app.services import user as service

router = APIRouter(prefix="/users", tags=["users"])


# Temporary until Person 4 adds JWT authentication.
def _user_id(user_id: int = Query(..., description="Temporary ID until authentication is connected")):
    return user_id


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(data: UserCreate, db: Session = Depends(get_db)):
    return service.create_user(db, data)


@router.get("/me", response_model=UserProfile)
def my_profile(user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return service.get_profile(db, user_id)


@router.patch("/me", response_model=UserRead)
def edit_profile(data: UserUpdate, user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    return service.update_user(db, user_id, data)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(user_id: int = Depends(_user_id), db: Session = Depends(get_db)):
    service.delete_user(db, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{user_id}", response_model=UserRead)
def view_user(user_id: int, db: Session = Depends(get_db)):
    return service.get_user(db, user_id)
