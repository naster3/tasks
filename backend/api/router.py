"""Router agregado que expone toda la superficie publica de la API."""

from fastapi import APIRouter

from .routes.audit import router as audit_router
from .routes.auth import router as auth_router
from .routes.health import router as health_router
from .routes.items import router as items_router
from .routes.movements import router as movements_router

api_router = APIRouter()
# Centraliza el registro de routers para que la factory de la app se mantenga pequena.
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(items_router)
api_router.include_router(movements_router)
api_router.include_router(audit_router)
