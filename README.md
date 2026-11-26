# Larp
Project Overview: Our LARP project stands for Local Adventure Route Planner which aims at providing users with an application where they will be able to find interesting local places, make a trip route, calculate expenses, save their routes, favorite locations, as well as provide their feedback via comments.

As for our GitHub repository content right now, it includes our Figma frontend designs and our project milestones along with planned issues and tasks to implement.

## Backend

The FastAPI backend lives in [`backend/`](backend/). See [`backend/README.md`](backend/README.md) for setup instructions, the data model, and which team member owns which part.

## Frontend

The Next.js + ShadCN UI frontend lives in [`frontend/`](frontend/). See [`frontend/README.md`](frontend/README.md) for setup, pages, tests, and who did which part.

## Run everything with Docker

```bash
docker compose up --build
```

Then open **https://localhost**. This starts PostgreSQL, the backend, the frontend, and an HTTPS proxy. Details are in [`frontend/README.md`](frontend/README.md#docker-compose--https).
