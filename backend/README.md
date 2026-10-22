# L.A.R.P Backend — Local Adventure Route Planner

FastAPI + SQLAlchemy + Pydantic backend for L.A.R.P: discover places, build trips (routes) out of them, estimate the budget, bookmark places and review them after your trip.

**Team:** Anay Keswani · Nutsa Papavadze · Arjay Lagera · Mitchell Naguib

---

## Setup

Requires **Python 3.10+**.

```bash
# 1. Clone the repo and go into the backend folder
git clone https://github.com/Badfadlad/L.A.R.P-Local-Adventure-Route-Planner.git
cd L.A.R.P-Local-Adventure-Route-Planner/backend

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
# (Windows: if activate is blocked, run once:
#  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned)

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your local config
cp .env.example .env               # Windows: copy .env.example .env

# 5. (Optional) add sample San Diego places
python scripts/seed.py

# 6. Run the server
uvicorn app.main:app --reload --app-dir src
# (Windows: if "uvicorn is not recognized", use
#  python -m uvicorn app.main:app --reload --app-dir src)
```

All commands are run from inside the `backend/` folder.

Open **http://127.0.0.1:8000/docs** for the interactive API docs (Swagger UI).

The database is a local SQLite file (`larp.db`) that is created automatically on startup. It's gitignored, so delete it any time you want a fresh start.

### Run the tests

```bash
pytest
```

---

## Project structure

```
backend/
├── pyproject.toml / requirements.txt   dependencies
├── .env.example                        config template (copy to .env)
├── scripts/seed.py                     sample data
├── tests/                              pytest tests
└── src/app/
    ├── main.py              creates the FastAPI app, creates tables on startup
    ├── api/v1/routes.py     plugs every router in under /api/v1
    ├── core/
    │   ├── settings.py      config from .env
    │   ├── database.py      engine, SessionLocal, Base, get_db()
    │   ├── dependencies.py  shared Depends() (get_db, later get_current_user)
    │   └── auth.py          password hashing + JWT (Part 5)
    ├── models/              SQLAlchemy tables (Part 2)
    ├── schemas/             Pydantic request/response models (Part 2)
    ├── repository/          database queries / CRUD (Part 3)
    ├── services/            business logic + errors (Part 3)
    └── routes/              API endpoints (Part 4)
```

**How a request flows:**
`routes/` (HTTP in/out) → `services/` (rules, 404/403/409 errors) → `repository/` (SQL queries) → `models/`.
`schemas/` validate what comes in and shape what goes out.

---

## Data model

```
User 1───* Trip 1───* TripStop *───1 Place
  │                                   │
  ├───* Bookmark *────────────────────┤
  └───* Review   *────────────────────┘
               └── (optional) Trip
```

| Model | What it is | Key fields |
|---|---|---|
| **User** | An account | `username`, `email` (both unique), `hashed_password`, `display_name`, `bio`, `home_city` |
| **Place** | Anything you can visit: restaurant, park, shop… | `name`, `category`, `subcategory`, `neighborhood`, `city`, `latitude/longitude`, `estimated_cost` (per person, 0 = free), `typical_duration_minutes` |
| **Trip** | A saved route, e.g. "Date Night" | `user_id`, `name`, `destination`, `trip_date`, `start_time`, `transport_mode`, `budget`, `status` (`planned`/`completed`), `completed_at` |
| **TripStop** | One stop in a trip | `trip_id`, `place_id`, `position` (1, 2, 3…), `arrival_time`, `duration_minutes`, `estimated_cost` (optional override) |
| **Bookmark** | A saved place | `user_id`, `place_id`, `note` — unique per user + place |
| **Review** | Post-trip rating | `user_id`, `place_id`, optional `trip_id`, `rating` (1–5, enforced), `comment`, `visited_on` |

**Enums** (`models/enums.py`):
- `PlaceCategory`: food, cafe, park, shop, activity, museum, viewpoint, beach, nightlife, other
- `TransportMode`: walking, driving, biking, transit
- `TripStatus`: planned, completed

**Computed values.** These aren't stored in the database. The models calculate them, and the schemas return them automatically:
- `Trip.estimated_total` is the sum of each stop's cost (the stop's override if set, otherwise the place's `estimated_cost`)
- `Trip.remaining_budget` = `budget - estimated_total`
- `Trip.overall_rating` is the average rating of the reviews linked to the trip
- `Trip.stop_count`, `Place.average_rating`, `Place.review_count`

**Deletes.** Deleting a user deletes their trips, stops, bookmarks and reviews. Deleting a trip deletes its stops, while reviews stay and just lose the trip link. Places are shared and are never deleted along with a user.

### Feature → where it lives

| Feature | Models / schemas |
|---|---|
| Profile creation | `User`, `UserCreate`, `UserProfile` (includes trip/bookmark/review counts) |
| Location discovery / search | `Place`, `PlaceSearchParams` (q, category, neighborhood, city, min/max cost) |
| Route creation | `Trip` + `TripStop`, `TripCreate` (stops can be nested), `TripStopReorder` |
| Budget prediction | `Trip.budget`, `estimated_total`, `remaining_budget` |
| Multiple stored routes | many `Trip`s per `User` |
| Post-trip review | `Review`, `ReviewCreate` |
| Bookmarks | `Bookmark`, `BookmarkCreate` |
| Travel history | trips where `status = completed` |
| Itinerary overview | `TripRead` (stops in order, cost, budget, rating) |

---

## Who's doing what

| Part | Owner | Files |
|---|---|---|
| 1 – Project setup | Anay | `pyproject.toml`, `requirements.txt`, `core/settings.py`, `core/database.py`, `main.py`, `api/v1/routes.py` ✅ |
| 2 – Models & schemas | Anay | `models/*`, `schemas/*` ✅ |
| 3 & 4 – Places / Trips | Arjay | `repository/`, `services/`, `routes/` → `place.py`, `trip.py` ✅ |
| 3 & 4 – Users / Bookmarks / Reviews | Person 3 | `repository/`, `services/`, `routes/` → `user.py`, `bookmark.py`, `review.py` |
| 5 & 6 – Auth, middleware, tests | Person 4 | `core/auth.py`, `core/dependencies.py` (`get_current_user`), `routes/auth.py`, `main.py` (CORS + logging), `tests/` (Person 1 already added model/schema tests; add CRUD + endpoint tests) |

Every file starts with an **OWNER / PART / STATUS** header saying who works on it and whether it's done. Search the project for `OWNER:  Person 2` (etc.) to find your files.

Every TODO file already has a docstring with suggested endpoints, and each router is already wired into `api/v1/routes.py`, so new endpoints show up in `/docs` automatically.

### Notes for teammates

- **Pydantic v2.** Use `model_config = ConfigDict(from_attributes=True)` (replaces `orm_mode`), `.model_dump()` (replaces `.dict()`), and `Schema.model_validate(orm_obj)`.
- **Creating from a schema:** `Place(**place_in.model_dump())`.
  **Updating:** `for k, v in update_in.model_dump(exclude_unset=True).items(): setattr(obj, k, v)`.
- **Passwords:** `UserCreate` has `password`, and the `User` model has `hashed_password`. Hash it before saving (Person 4's `core/auth.py`) and never return it.
- **Trip stops:** `trip.stops` always comes back sorted by `position`. When reordering, set `position = 1..n` in the new order.
- **Not found:** raise `HTTPException(status_code=404, detail="Place not found")` in the service layer.
- **Test DB:** `tests/conftest.py` has a `db` fixture (fresh in-memory SQLite per test).
