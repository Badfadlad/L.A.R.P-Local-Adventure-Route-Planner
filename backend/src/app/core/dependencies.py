# ======================================================================
# OWNER:  Person 1 (Anay) + Person 4 (Nutsa)
# PART:   Part 1 (get_db) + Part 5 (get_current_user)
# STATUS: DONE
# ======================================================================

"""Shared FastAPI dependencies.

`get_db` is re-exported here so routes can import all dependencies from one place.

`get_current_user` protects an endpoint: it reads the JWT from the
`Authorization: Bearer <token>` header and returns the logged-in User
(or responds 401 if the token is missing/invalid).

    from app.core.dependencies import get_current_user
    from app.models import User

    @router.get("/trips")
    def list_trips(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.auth import decode_access_token
from app.core.database import get_db
from app.core.settings import settings
from app.models import User

# tokenUrl tells Swagger UI (/docs) where to log in, so the "Authorize" button works.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Return the User the bearer token belongs to, or raise 401."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error

    # The login route puts the user's id in "sub" (as a string, per the JWT spec).
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise credentials_error

    user = db.get(User, user_id)
    if user is None:
        raise credentials_error
    return user


__all__ = ["get_db", "get_current_user", "oauth2_scheme"]
