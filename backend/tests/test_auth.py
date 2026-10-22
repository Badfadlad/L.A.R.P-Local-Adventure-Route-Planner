# ======================================================================
# OWNER:  Person 4 (Nutsa)
# PART:   Part 6 - Testing
# STATUS: DONE
# ======================================================================

"""Tests for Part 5 auth: password hashing, JWTs, get_current_user and /auth routes."""

from datetime import timedelta

from app.core.auth import create_access_token, decode_access_token, hash_password, verify_password

REGISTER = "/api/v1/auth/register"
LOGIN = "/api/v1/auth/login"
ME = "/api/v1/auth/me"


# --- core/auth.py --------------------------------------------------------


def test_hash_password_is_not_plain_text_and_verifies():
    hashed = hash_password("password123")
    assert hashed != "password123"
    assert hashed.startswith("$2b$")  # bcrypt hash
    assert verify_password("password123", hashed)
    assert not verify_password("wrong-password", hashed)


def test_same_password_gets_different_hashes():
    # bcrypt adds a random "salt", so two hashes of one password differ
    assert hash_password("password123") != hash_password("password123")


def test_passwords_longer_than_72_bytes_work():
    # bcrypt 5.x raises an error past 72 bytes; our helper must not crash
    long_password = "a" * 128
    assert verify_password(long_password, hash_password(long_password))


def test_verify_password_with_garbage_hash_returns_false():
    assert verify_password("password123", "not-a-real-hash") is False


def test_token_round_trip():
    token = create_access_token({"sub": "42"})
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert "exp" in payload


def test_expired_token_is_rejected():
    token = create_access_token({"sub": "42"}, expires_delta=timedelta(minutes=-1))
    assert decode_access_token(token) is None


def test_tampered_token_is_rejected():
    token = create_access_token({"sub": "42"})
    assert decode_access_token(token[:-2] + "xx") is None
    assert decode_access_token("not.a.token") is None


# --- POST /auth/register -----------------------------------------------


def test_register_creates_user_and_hides_password(client, db):
    response = client.post(REGISTER, json={
        "username": "anay", "email": "anay@example.com", "password": "password123",
    })
    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "anay"
    assert "password" not in body
    assert "hashed_password" not in body

    from app.models import User
    saved = db.get(User, body["id"])
    assert saved.hashed_password != "password123"
    assert verify_password("password123", saved.hashed_password)


def test_register_duplicate_username_or_email_is_409(client, user):
    taken_username = client.post(REGISTER, json={
        "username": "nutsa", "email": "other@example.com", "password": "password123",
    })
    assert taken_username.status_code == 409

    taken_email = client.post(REGISTER, json={
        "username": "someone", "email": "nutsa@example.com", "password": "password123",
    })
    assert taken_email.status_code == 409


def test_register_validates_input(client):
    response = client.post(REGISTER, json={
        "username": "anay", "email": "not-an-email", "password": "short",
    })
    assert response.status_code == 422


# --- POST /auth/login ----------------------------------------------------


def test_login_returns_bearer_token(client, user):
    response = client.post(LOGIN, data={"username": "nutsa", "password": "password123"})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert decode_access_token(body["access_token"])["sub"] == str(user.id)


def test_login_with_email_works(client, user):
    response = client.post(LOGIN, data={"username": "nutsa@example.com", "password": "password123"})
    assert response.status_code == 200


def test_login_wrong_password_or_unknown_user_is_401(client, user):
    wrong_password = client.post(LOGIN, data={"username": "nutsa", "password": "wrong-password"})
    unknown_user = client.post(LOGIN, data={"username": "nobody", "password": "password123"})
    assert wrong_password.status_code == 401
    assert unknown_user.status_code == 401
    # Same message either way, so nobody can tell which usernames exist
    assert wrong_password.json() == unknown_user.json()


# --- GET /auth/me (get_current_user) ---------------------------------------


def test_me_returns_logged_in_user(client, auth_headers):
    response = client.get(ME, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "nutsa"


def test_full_flow_register_login_me(client):
    client.post(REGISTER, json={"username": "arjay", "email": "arjay@example.com", "password": "password123"})
    token = client.post(LOGIN, data={"username": "arjay", "password": "password123"}).json()["access_token"]
    response = client.get(ME, headers={"Authorization": f"Bearer {token}"})
    assert response.json()["email"] == "arjay@example.com"


def test_me_without_token_is_401(client):
    assert client.get(ME).status_code == 401


def test_me_with_bad_token_is_401(client):
    response = client.get(ME, headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


def test_me_with_expired_token_is_401(client, user):
    token = create_access_token({"sub": str(user.id)}, expires_delta=timedelta(minutes=-1))
    assert client.get(ME, headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_me_with_token_missing_sub_is_401(client):
    token = create_access_token({"username": "nutsa"})
    assert client.get(ME, headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_me_for_deleted_user_is_401(client, db, user, auth_headers):
    db.delete(user)
    db.commit()
    assert client.get(ME, headers=auth_headers).status_code == 401
