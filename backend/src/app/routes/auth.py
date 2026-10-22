# ======================================================================
# OWNER:  Person 4 (Nutsa)
# PART:   Part 5 - Auth endpoints
# STATUS: DONE
# ======================================================================

"""Auth endpoints.

    POST /auth/register   create an account (JSON body: UserCreate) -> UserRead
    POST /auth/login      form fields username + password            -> Token
    GET  /auth/me         the logged-in user (needs Bearer token)    -> UserRead

Login uses OAuth2PasswordRequestForm (form data, not JSON) so the
"Authorize" button in /docs works. You can log in with either your
username or your email in the `username` field.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, hash_password, verify_password
from app.core.dependencies import get_current_user, get_db
from app.models import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.username == data.username)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        **data.model_dump(exclude={"password"}),
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.scalar(
        select(User).where((User.username == form.username) | (User.email == form.username))
    )
    # Same message for "no such user" and "wrong password", so attackers
    # can't use this endpoint to find out which usernames exist.
    if user is None or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user
