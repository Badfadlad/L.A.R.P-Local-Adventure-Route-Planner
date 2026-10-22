# ======================================================================
# OWNER:  Person 2
# PART:   Part 3 - Business logic for Places
# STATUS: TODO
# ======================================================================

"""Place business logic - TODO (Person 2, Part 3).

The service layer sits between routes and the repository: it checks rules
(ownership, duplicates, "not found" -> raise HTTPException 404/403/409)
and calls app.repository.place to read/write data.
"""
