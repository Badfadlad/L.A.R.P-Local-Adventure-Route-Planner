# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 1 - Project Setup
# STATUS: DONE
# ======================================================================

"""Application settings, loaded from environment variables / a `.env` file.

Anywhere in the app, import the shared instance:

    from app.core.settings import settings
    print(settings.DATABASE_URL)
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "LARP API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # SQLite by default so nobody has to install a database server.
    DATABASE_URL: str = "sqlite:///./larp.db"

    # Auth (used by Part 5)
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS (used by Part 5) - comma-separated string in .env
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
