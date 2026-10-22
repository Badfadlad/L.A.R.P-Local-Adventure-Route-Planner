# ======================================================================
# OWNER:  Person 4 (Nutsa)
# PART:   Part 6 - Testing
# STATUS: DONE
# ======================================================================

"""Tests for Part 5 middleware: CORS and request logging (in main.py)."""

import logging

from app.core.settings import settings

ALLOWED_ORIGIN = settings.cors_origins_list[0]


def test_cors_preflight_from_allowed_origin(client):
    # A browser sends this OPTIONS "preflight" request before a cross-origin POST
    response = client.options("/api/v1/auth/login", headers={
        "Origin": ALLOWED_ORIGIN,
        "Access-Control-Request-Method": "POST",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN


def test_cors_header_on_normal_request(client):
    response = client.get("/", headers={"Origin": ALLOWED_ORIGIN})
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN


def test_cors_blocks_unknown_origin(client):
    response = client.get("/", headers={"Origin": "http://evil.example.com"})
    assert "access-control-allow-origin" not in response.headers


def test_request_logging_adds_process_time_header(client):
    response = client.get("/")
    assert float(response.headers["X-Process-Time"]) >= 0


def test_request_logging_writes_a_log_line(client, caplog):
    with caplog.at_level(logging.INFO, logger="app.requests"):
        client.get("/")
        client.get("/api/v1/auth/me")  # 401, should still be logged

    messages = [record.getMessage() for record in caplog.records if record.name == "app.requests"]
    assert any(m.startswith("GET / -> 200") for m in messages)
    assert any(m.startswith("GET /api/v1/auth/me -> 401") for m in messages)
