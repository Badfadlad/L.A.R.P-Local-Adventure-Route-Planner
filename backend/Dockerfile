# L.A.R.P backend (FastAPI) - image used by docker-compose.yml in the repo root.
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt .
# psycopg: the PostgreSQL driver (the app uses SQLite when run without Docker).
RUN pip install --no-cache-dir -r requirements.txt "psycopg[binary]>=3.2"

COPY . .
RUN useradd --create-home app && chown -R app /app
USER app

EXPOSE 8000
# Add the sample San Diego places (safe to repeat), then start the API.
CMD ["sh", "-c", "python scripts/seed.py && uvicorn app.main:app --app-dir src --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'"]
