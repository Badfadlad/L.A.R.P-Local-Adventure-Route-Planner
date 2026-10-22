# OWNER: Person 3 | Part 3 - Users repository
from sqlalchemy.orm import Session
from app.models import User


# find users in the database
def get_by_id(db: Session, user_id: int):
    return db.get(User, user_id)


def get_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def get_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


# add a user with a hashed password
def create(db: Session, data: dict):
    user = User(**data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# save changed profile fields
def update(db: Session, user: User, changes: dict):
    for field, value in changes.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def delete(db: Session, user: User):
    db.delete(user)
    db.commit()
