# OWNER: Person 3 | Part 3 - Users service
from fastapi import HTTPException
from passlib.context import CryptContext
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Bookmark, Review, Trip
from app.repository import user as repo
from app.schemas.user import UserCreate, UserUpdate

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# register a user; never save the plain password
def create_user(db: Session, data: UserCreate):
    if repo.get_by_username(db, data.username):
        raise HTTPException(409, "Username already exists")
    if repo.get_by_email(db, data.email):
        raise HTTPException(409, "Email already exists")
    fields = data.model_dump(exclude={"password"})
    fields["hashed_password"] = password_context.hash(data.password)
    try:
        return repo.create(db, fields)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Username or email already exists")


# find a user's public profile
def get_user(db: Session, user_id: int):
    user = repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user


# show the counts on the profile page
def get_profile(db: Session, user_id: int):
    user = get_user(db, user_id)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "display_name": user.display_name,
        "bio": user.bio,
        "home_city": user.home_city,
        "created_at": user.created_at,
        "trip_count": db.query(Trip).filter(Trip.user_id == user_id).count(),
        "bookmark_count": db.query(Bookmark).filter(Bookmark.user_id == user_id).count(),
        "review_count": db.query(Review).filter(Review.user_id == user_id).count(),
    }


# update only supplied fields
def update_user(db: Session, user_id: int, data: UserUpdate):
    user = get_user(db, user_id)
    changes = data.model_dump(exclude_unset=True)
    if "email" in changes and changes["email"] is None:
        raise HTTPException(422, "Email cannot be empty")
    if "email" in changes and changes["email"] != user.email:
        if repo.get_by_email(db, changes["email"]):
            raise HTTPException(409, "Email already exists")
    if "password" in changes:
        password = changes.pop("password")
        if password is None:
            raise HTTPException(422, "Password cannot be empty")
        changes["hashed_password"] = password_context.hash(password)
    try:
        return repo.update(db, user, changes)
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email already exists")


# remove a user and their related records
def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    repo.delete(db, user)
