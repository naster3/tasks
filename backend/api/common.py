"""Helpers compartidos de API para routers, middleware y manejo de excepciones.

Este modulo evita repetir pequenas piezas transversales: armado de contexto para
logs, registro de eventos de negocio y acceso tipado al username del usuario.
"""

from typing import Any, Dict, cast

from fastapi import Request

from ..core.logging import get_logger
from ..db.models import User

logger = get_logger("inventory.api")


def request_context(request: Request, **extra: Any) -> Dict[str, Any]:
    # Centraliza el contexto minimo comun que debe viajar en logs estructurados.
    # Asi middleware, handlers y rutas reportan request_id, metodo y path con
    # exactamente la misma forma antes de agregar campos especificos.
    context: Dict[str, Any] = {
        "request_id": getattr(request.state, "request_id", None),
        "method": request.method,
        "path": request.url.path,
    }
    context.update({key: value for key, value in extra.items() if value is not None})
    return context


def log_business_event(request: Request, event: str, **extra: Any) -> None:
    # Los eventos de negocio sirven para entender "que paso" en terminos funcionales:
    # login exitoso, item creado, item archivado, movimiento registrado, etc.
    # Se construyen sobre el mismo request_context para que convivan bien con logs tecnicos.
    logger.info(
        "Business event",
        extra={"context": request_context(request, event=event, **extra)},
    )


def username_of(user: User) -> str:
    # Encapsula el cast del modelo ORM y deja mas legible el codigo de rutas y servicios.
    return cast(str, user.username)
