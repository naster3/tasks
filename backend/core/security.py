"""Dependencias de autenticacion y autorizacion para rutas FastAPI.

Este modulo define la validacion de sesiones basada en bearer token y la
comprobacion de roles permitidos. Su objetivo es que todas las rutas usen una
misma politica de seguridad y un mismo formato de logs de rechazo.
"""

from datetime import datetime
from typing import Optional, cast

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, selectinload

from ..db.models import Token, User, now_utc
from ..db.session import get_db
from ..services.errors import error_response
from ..services.rate_limit import check_rate_limit
from .logging import get_logger

security = HTTPBearer(auto_error=False)
logger = get_logger("inventory.security")


def token_expires_at(token: Token) -> datetime:
    # Helper pequeno para encapsular el cast de columnas clasicas de SQLAlchemy.
    return cast(datetime, token.expires_at)


def user_role(user: User) -> str:
    # Se mantiene separado para no repetir casts en la logica de autorizacion.
    return cast(str, user.role)


def username_of(user: User) -> str:
    # Igual que user_role, centraliza el acceso tipado al username del modelo.
    return cast(str, user.username)


def security_context(request: Request, **extra: object) -> dict[str, object]:
    # Los logs de seguridad usan la misma forma de contexto que el resto de la API.
    # Eso permite correlacionar facilmente un rechazo de auth con el request original
    # usando request_id, metodo, path y cualquier dato extra relevante.
    context: dict[str, object] = {
        "request_id": getattr(request.state, "request_id", None),
        "method": request.method,
        "path": request.url.path,
    }
    context.update({key: value for key, value in extra.items() if value is not None})
    return context


def log_security_rejection(request: Request, event: str, **extra: object) -> None:
    # Todo rechazo de seguridad se canaliza por este helper para no dispersar el formato.
    logger.warning(
        "Security rejection",
        extra={"context": security_context(request, event=event, **extra)},
    )


def require_user(roles: Optional[list[str]] = None):
    # Esta funcion devuelve una dependencia de FastAPI parametrizable por roles.
    # Asi una misma pieza de logica sirve tanto para "solo autenticado" como para
    # "autenticado y con uno de estos roles concretos".
    def dependency(
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db: Session = Depends(get_db),
    ) -> User:
        # Los bearer tokens ausentes o con esquema incorrecto se rechazan como 401.
        # Se aplica rate limit incluso aqui para que los intentos incompletos tambien
        # cuenten dentro de la politica de proteccion contra abuso.
        if not credentials or credentials.scheme.lower() != "bearer":
            check_rate_limit(request)
            log_security_rejection(request, "auth.token.missing")
            raise error_response(
                401,
                "Missing token",
                internal={"event": "auth.token.missing", "error_kind": "security"},
            )

        token = (
            db.query(Token)
            .options(selectinload(Token.user))
            .filter(Token.token == credentials.credentials.strip())
            .first()
        )
        if not token:
            # Un token inexistente puede venir de una sesion invalida o de un intento
            # manual de adivinar tokens. Por eso tambien consume rate limit y se registra.
            check_rate_limit(request)
            log_security_rejection(request, "auth.token.invalid")
            raise error_response(
                401,
                "Invalid token",
                internal={"event": "auth.token.invalid", "error_kind": "security"},
            )

        if token_expires_at(token) < now_utc():
            # La expiracion se comprueba antes de evaluar roles para que una sesion vencida
            # nunca llegue a comportarse como autenticada, aunque el usuario exista.
            check_rate_limit(request)
            log_security_rejection(request, "auth.token.expired")
            raise error_response(
                401,
                "Invalid token",
                internal={"event": "auth.token.expired", "error_kind": "security"},
            )

        user = token.user
        # A partir de aqui el request ya tiene identidad; el rate limit cambia a nivel usuario.
        check_rate_limit(request, user)

        if roles and user_role(user) not in roles:
            # Si el usuario esta autenticado pero no tiene permisos, el rechazo es 403.
            # El log incluye rol recibido y roles permitidos para facilitar auditoria y soporte.
            log_security_rejection(
                request,
                "auth.forbidden",
                actor=username_of(user),
                role=user_role(user),
                required_roles=roles,
            )
            raise error_response(
                403,
                "Forbidden",
                internal={
                    "event": "auth.forbidden",
                    "error_kind": "security",
                    "actor": username_of(user),
                    "role": user_role(user),
                    "required_roles": roles,
                },
            )

        # La dependencia devuelve el usuario listo para que la ruta pueda registrar actor o role.
        return user

    return dependency
