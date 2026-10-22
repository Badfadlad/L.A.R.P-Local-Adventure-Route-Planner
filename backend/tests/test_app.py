# ======================================================================
# OWNER:  Person 1 (Anay) + Person 4
# PART:   Part 6 - Testing
# STATUS: Startup test DONE by Person 1 / Person 4 adds more
# ======================================================================

"""Smoke test for Part 1: the app boots and serves docs."""

from fastapi.testclient import TestClient

from app.main import app


def test_app_starts_and_serves_docs():
    with TestClient(app) as client:
        assert client.get("/").json()["status"] == "ok"
        assert client.get("/docs").status_code == 200
        assert client.get("/openapi.json").status_code == 200
