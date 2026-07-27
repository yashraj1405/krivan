import socket
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


def get_local_ip() -> str:
    """
    Utility to discover the machine's primary local IP address on Wi-Fi/LAN.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


class Settings(BaseSettings):
    PROJECT_NAME: str = "Fertilizer Product Traceability & QR Verification System"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "supersecretjwtkeythatisproductionreadyandlong"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/fertilizer_db"

    # Seed Admin Account
    FIRST_SUPERUSER_EMAIL: str = "admin@fertilizer.com"
    FIRST_SUPERUSER_PASSWORD: str = "adminpassword"
    FIRST_SUPERUSER_FULL_NAME: str = "System Admin"

    # Permanent Public Tunnel Base URL for mobile QR scanning
    FRONTEND_BASE_URL: str = "https://alien-contributed-neo-drag.trycloudflare.com"

    # CORS origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "*",
    ]

    def get_frontend_url(self) -> str:
        if self.FRONTEND_BASE_URL:
            return self.FRONTEND_BASE_URL.rstrip("/")
        local_ip = get_local_ip()
        return f"http://{local_ip}:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
