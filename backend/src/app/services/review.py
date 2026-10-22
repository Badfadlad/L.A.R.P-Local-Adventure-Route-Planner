# ======================================================================
# OWNER:  Person 3
# PART:   Part 3 - Business logic for Reviews
# STATUS: TODO
# ======================================================================

"""Review business logic - TODO (Person 3, Part 3).

The service layer sits between routes and the repository: it checks rules
(ownership, duplicates, "not found" -> raise HTTPException 404/403/409)
and calls app.repository.review to read/write data.
"""
