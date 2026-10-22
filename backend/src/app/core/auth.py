# ======================================================================
# OWNER:  Person 4 (Nutsa)
# PART:   Part 5 - Authentication & Middleware
# STATUS: DONE
# ======================================================================

"""Authentication helpers: password hashing and JWT access tokens.

    from app.core.auth import hash_password, verify_password, create_access_token

    user.hashed_password = hash_password("password123")
    verify_password("password123", user.hashed_password)   # True
    token = create_access_token({"sub": str(user.id)})

Passwords are hashed with the `bcrypt` library directly. (passlib 1.7.4 is
unmaintained and crashes with bcrypt 5.x, so we don't use it.)
"""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.settings import settings

# bcrypt only looks at the first 72 bytes of a password, and bcrypt 5.x
# raises an error for anything longer. We cut it to 72 bytes ourselves,
# the same way every time, so long passwords still work.
_BCRYPT_MAX_BYTES = 72


def _password_bytes(plain: str) -> bytes:
    return plain.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of `plain`, safe to store in User.hashed_password."""
    return bcrypt.hashpw(_password_bytes(plain), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """True if `plain` matches the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(_password_bytes(plain), hashed.encode("utf-8"))
    except ValueError:
        # Stored value isn't a valid bcrypt hash
        return False


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT containing `data` plus an expiry time ("exp")."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Return the token's payload, or None if it's invalid, tampered with, or expired."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None
