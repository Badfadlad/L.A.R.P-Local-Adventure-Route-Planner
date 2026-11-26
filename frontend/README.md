# L.A.R.P Frontend: Local Adventure Route Planner

Next.js (React) + ShadCN UI frontend for L.A.R.P. Find places around San Diego, build a day route, track the budget, save trips, bookmark places and review them after your trip. It talks to the FastAPI backend in [`../backend`](../backend).

**Team:** Anay Keswani · Nutsa Papavadze · Arjay Lagera · Mitchell Naguib

| Part | What | Who |
| --- | --- | --- |
| 1 | Project setup (Next.js, ShadCN UI, Axios) | Mitchell |
| 2 | Login / sign-up pages, auth state (`AuthContext`) | Anay |
| 3 | API integration (`api.js`, `PlaceList`, `TripList`) | Arjay |
| 4 | Responsive pages from the Figma designs (mobile + desktop) | Nutsa |
| 5 | Tests: Jest + React Testing Library, Playwright, Storybook | Nutsa |
| Extra | Docker Compose, HTTPS, security, Figma, UI tests | Nutsa |

---

## Setup

You need **Node.js 20+** and the backend running (see [`../backend/README.md`](../backend/README.md)).

```bash
# 1. Start the backend first (in another terminal), from backend/:
#    uvicorn app.main:app --reload --app-dir src
#    python scripts/seed.py        # sample San Diego places

# 2. From frontend/:
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
npm run dev
```

Open **http://localhost:3000**.

`.env.local` holds the backend address: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm start` | Production build / run it |
| `npm run lint` | ESLint |
| `npm test` | Unit + component + integration tests (Jest) |
| `npm run test:coverage` | Same, with a coverage report |
| `npm run test:e2e` | End-to-end tests in real browsers (Playwright) |
| `npm run storybook` | Component explorer on port 6006 |

---

## Pages

| Page | URL | From Figma |
| --- | --- | --- |
| Home | `/` | Hero, "Plan my day" box, quick picks. What you type becomes Discover filters and a budget ("parks and lunch under $60"). |
| Discover | `/discover` | Search, filter chips (Food, Parks, Under $25...), place cards with **Add Stop** and bookmarks, map. |
| Plan a Trip | `/plan` | Route Builder: itinerary (reorder with arrows or drag), **Optimize my route**, travel mode, route map, trip summary, budget, travel details, day schedule (Export = print / PDF), **Save this trip**. |
| My Trips | `/trips` | Planned trips and travel history; mark completed, delete. |
| Profile | `/profile` | Profile header + Edit Profile, saved trips, tabs for trips / bookmarks / reviews, **Review Your Visit** for places from completed trips. |
| Log in / Sign up | `/login`, `/register` | Part 2 |

Distances and travel times are estimated from each place's latitude/longitude (no map API key needed). See `src/lib/route.js`.

---

## Part 4: Responsive design

- Built mobile-first with **Tailwind breakpoints** (CSS media queries): `sm` 640px, `md` 768px, `lg` 1024px.
- **Phones:** bottom tab bar (Home · Explore · Plan · Trips · Profile) and a slide-in **Menu**, like the Figma mobile designs. Map sits above the list, cards stack, and page content leaves room above the tab bar.
- **Desktop:** header links, Discover list + map side by side, Route Builder in three columns.
- **ShadCN UI** everywhere: Button, Card, Input, Label (from setup) plus Badge, Tabs, Dialog, Textarea, Skeleton added in `src/components/ui/`.
- **Accessibility:** skip-to-content link, labels on every field, `aria-current` on the active link, star rating and travel modes are keyboard-friendly radio groups, reorder works without dragging, live status messages, alt text on images, respects "reduce motion".

## Part 5: Testing

```
__tests__/
  unit/          route math, filters, validation, dates, token expiry
  components/    PlaceCard, StarRating, ReviewForm, TripCard, BudgetCard...
  integration/   login, sign-up, Discover data fetching, Add Stop, header (API mocked)
e2e/             Playwright: real browser + real backend
src/stories/     Storybook stories with interaction tests
```

- **Jest + React Testing Library:** `npm test`. 69 tests.
- **Playwright** (end-to-end + UI): `npx playwright install` once, then `npm run test:e2e`. It starts the frontend (and the backend if it isn't running) and runs 12 tests in **5 browsers**: desktop Chrome, Firefox and Safari (WebKit), plus phone-sized Chrome (Pixel 7) and Safari (iPhone 14). Covers:
  - sign up → log out → wrong password → log in
  - home prompt → Discover filters
  - Discover → add stops → reorder → travel mode → save → complete → review → bookmarks
  - edit profile, login-required pages
  - no sideways scrolling on any page, phone vs desktop navigation, map position, skip link, labels/alt text, security headers
  - Run one browser: `npx playwright test --project=desktop-chrome`. Report: `npx playwright show-report`.
- **Storybook:** `npm run storybook`. Stories for place cards, review form, trip cards, budget, maps, filters, with **interaction tests** (`play` functions) and the **accessibility addon** (a11y tab).

## Extra credit

### Docker Compose + HTTPS

From the **repo root**:

```bash
docker compose up --build
```

Open **https://localhost** (your browser warns about the local certificate the first time; that's expected). This starts:

- **PostgreSQL** database (`db`)
- **FastAPI** backend (`backend`, adds the sample places on start)
- **Next.js** frontend (`frontend`, production build)
- **Caddy** (`proxy`): HTTPS for everything, HTTP → HTTPS redirect, HSTS. `/api/*` and `/docs` go to the backend, everything else to the frontend.

Copy `.env.example` to `.env` in the repo root to set your own `POSTGRES_PASSWORD` and `SECRET_KEY`. Stop with `docker compose down` (add `-v` to wipe the database).

### Cyber security

- **HTTPS** via Caddy (above), plus `Strict-Transport-Security`.
- **Security headers** on every page (`next.config.mjs`): Content-Security-Policy (only our own scripts, API and images), `X-Frame-Options: DENY` (no clickjacking), `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. The `X-Powered-By` header is turned off.
- **Input validation and sanitizing** (`src/lib/validation.js`): trims, strips control characters and caps length, using the same limits as the backend. React escapes everything it renders and we never use `dangerouslySetInnerHTML`. Image URLs from the database must be `http(s)` or local.
- **Token handling:** expired JWTs are dropped before they're sent, and a 401 from the backend logs you out everywhere (`api.js`, `AuthContext.js`).
- **Fonts are self-hosted** (`@fontsource`), so no requests go to Google.
- Docker images run as a **non-root user**.

### Figma

The pages follow the team's Figma designs in [`../Figma Front End`](../Figma%20Front%20End). Photos in `public/images` come from those designs.

---

## Project structure

```
src/
  app/                  pages (Next.js App Router): /, discover, plan, trips, profile, login, register
  api/api.js            Axios instance + helpers for every backend resource
  context/AuthContext   logged-in user + token (localStorage)
  components/
    ui/                 ShadCN UI components
    layout/             header, mobile tab bar, logo
    places/             Discover page, place card, filter chips, map
    route/              Route Builder pieces
    trips/, profile/    My Trips and Profile pages
  lib/                  plain JS helpers (route math, validation, places, dates, active trip)
  stories/              Storybook stories
__tests__/              Jest tests
e2e/                    Playwright tests
```
