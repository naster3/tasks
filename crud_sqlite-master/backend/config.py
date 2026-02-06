import os

from dotenv import load_dotenv

load_dotenv()


def get_config():
    return {
        "SECRET_KEY": os.getenv("SECRET_KEY", "dev"),
        "SQLALCHEMY_DATABASE_URI": os.getenv("DATABASE_URL", "sqlite:///task.db"),
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "DEBUG": os.getenv("DEBUG", "false").lower() == "true",
        "API_HOST": os.getenv("API_HOST", "127.0.0.1"),
        "API_PORT": int(os.getenv("API_PORT", "5000")),
        "API_KEY": os.getenv("API_KEY", ""),
        "CORS_ORIGINS": os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,tauri://localhost"
        ),
        "RATELIMIT_DEFAULT": os.getenv("RATELIMIT_DEFAULT", "200 per hour"),
        "RATELIMIT_STORAGE_URI": os.getenv("RATELIMIT_STORAGE_URI", "memory://"),
        "RATELIMIT_ENABLED": os.getenv("RATELIMIT_ENABLED", "true").lower() == "true",
        "CACHE_TTL_SECONDS": int(os.getenv("CACHE_TTL_SECONDS", "5")),
    }
