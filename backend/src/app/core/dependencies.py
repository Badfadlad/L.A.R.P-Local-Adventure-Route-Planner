# ======================================================================
# OWNER:  Person 1 (Anay) + Person 4
# PART:   Part 1 (get_db) + Part 5 (get_current_user)
# STATUS: get_db DONE by Person 1 / get_current_user TODO by Person 4
# ======================================================================

"""Shared FastAPI dependencies.

`get_db` is re-exported here so routes can import all dependencies from one place.

TODO (Person 4 - Part 5): add `get_current_user`, which reads the JWT from the
`Authorization: Bearer <token>` header, decodes it with app.core.auth, and
loads the User from the database (raise 401 if invalid).
"""

from app.core.database import get_db

__all__ = ["get_db"]
