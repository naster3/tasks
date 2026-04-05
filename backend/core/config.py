"""Configuracion basada en variables de entorno usada en todo el backend.

Este modulo concentra valores de runtime para que el resto del codigo no lea
variables de entorno dispersas por todos lados. Asi la app mantiene un unico
punto de entrada para defaults, normalizacion y pequenas reglas de configuracion.
"""

import os
from typing import Any, Dict, List

from sqlalchemy.pool import StaticPool


def normalize_database_url(url: str) -> str:
    # Algunas plataformas aun entregan postgres://; SQLAlchemy moderno espera postgresql://.
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def parse_csv_env(value: str) -> List[str]:
    # Convierte variables "a,b,c" en listas limpias y sin entradas vacias.
    return [entry.strip() for entry in value.split(",") if entry.strip()]


# Estos valores se resuelven al importar el modulo, lo que simplifica el acceso
# pero asume que el entorno ya esta preparado antes de iniciar la aplicacion.
DEFAULT_RATE_LIMIT = int(os.environ.get("API_RATE_LIMIT", "120"))
CACHE_TTL_SECONDS = int(os.environ.get("CACHE_TTL_SECONDS", "30"))
# Usa SQLite por defecto para que el proyecto pueda arrancar localmente sin servicios extra.
DATABASE_URL = normalize_database_url(os.environ.get("DATABASE_URL", "sqlite:///inventory.db"))
APP_ENV = os.environ.get("APP_ENV", "development").strip().lower()
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").strip().upper()
LOG_TO_FILE = os.environ.get("LOG_TO_FILE", "true").strip().lower() == "true"
LOG_FILE_PATH = os.environ.get("LOG_FILE_PATH", "logs/app.log").strip()
ALLOW_ALL_CORS = os.environ.get("ALLOW_ALL_CORS", "false").strip().lower() == "true"
CORS_ORIGINS = parse_csv_env(os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"))
CORS_ALLOW_CREDENTIALS = not ALLOW_ALL_CORS

if ALLOW_ALL_CORS:
    # Si se habilita CORS total, las credenciales se desactivan en otro punto para respetar la especificacion.
    CORS_ORIGINS = ["*"]


def get_engine_kwargs() -> Dict[str, Any]:
    # Este helper encapsula diferencias de engine por backend para que session.py
    # no tenga que conocer detalles particulares de SQLite o futuros motores.
    engine_kwargs: Dict[str, Any] = {}
    if DATABASE_URL.startswith("sqlite"):
        # SQLite necesita relajar el control de hilos porque FastAPI puede reutilizar sesiones.
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        if DATABASE_URL == "sqlite://":
            # StaticPool mantiene viva la misma base en memoria entre sesiones.
            engine_kwargs["poolclass"] = StaticPool
    return engine_kwargs
