"""Hooks de arranque y apagado para la inicializacion global de la app."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from ..core.logging import get_logger
from ..db.models import now_utc
from ..db.session import Base, SessionLocal, engine
from ..services.users import seed_users

logger = get_logger("inventory.api")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Crea tablas al iniciar porque el proyecto todavia no usa migraciones.
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Siembra los usuarios integrados una sola vez para que la API sea util desde el primer arranque.
        seed_users(db)
        logger.info(
            "Application startup completed",
            extra={"context": {"event": "startup", "started_at": now_utc().isoformat()}},
        )
    finally:
        db.close()
    yield
    # El log de apagado es liviano porque el cierre no requiere limpieza compleja.
    logger.info(
        "Application shutdown completed",
        extra={"context": {"event": "shutdown", "stopped_at": now_utc().isoformat()}},
    )
