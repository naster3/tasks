"""Factory principal de la aplicacion FastAPI de inventario."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..core.config import CORS_ALLOW_CREDENTIALS, CORS_ORIGINS
from .errors import register_exception_handlers
from .lifecycle import lifespan
from .middleware import register_middleware
from .router import api_router


def create_app() -> FastAPI:
    # Construye la aplicacion una sola vez y conecta primero las preocupaciones transversales.
    application = FastAPI(title="Inventory API", lifespan=lifespan)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=CORS_ALLOW_CREDENTIALS,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Registra handlers antes de exponer rutas para que todas compartan el mismo comportamiento.
    register_exception_handlers(application)
    register_middleware(application)
    application.include_router(api_router)
    return application


app = create_app()
