# ======================================================================
# OWNER:  Person 4
# PART:   Part 5 - Authentication & Middleware
# STATUS: TODO
# ======================================================================

"""Authentication helpers.

TODO (Person 4 - Part 5):
    - hash_password(plain) / verify_password(plain, hashed)   -> passlib (bcrypt)
    - create_access_token(data, expires_delta)                 -> python-jose (JWT)
    - decode_access_token(token)

Use settings.SECRET_KEY, settings.ALGORITHM and settings.ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.settings. The User model stores the hash in `User.hashed_password`.
"""
