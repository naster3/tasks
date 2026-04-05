"""Rate limit simple en memoria por IP o por usuario autenticado.

Este modulo aplica una proteccion basica por ventana fija de un minuto. No usa
Redis ni almacenamiento compartido, asi que su alcance es el proceso actual,
pero para desarrollo y despliegues sencillos resulta suficiente.
"""

import time
from typing import Dict, Optional

from fastapi import Request

from ..core.config import DEFAULT_RATE_LIMIT
from ..db.models import User
from .errors import error_response

RATE_BUCKETS: Dict[str, Dict[str, int]] = {}


def get_client_ip(request: Request) -> str:
    # Intenta identificar al cliente real incluso cuando la app esta detras de un proxy.
    # Si existe x-forwarded-for, se toma el primer salto porque normalmente representa
    # la IP original reportada por el balanceador o reverse proxy.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_rate_limit_key(request: Request, user: Optional[User] = None) -> str:
    # Cuando ya existe un usuario autenticado, la limitacion pasa de IP a identidad.
    # Eso evita que varios usuarios detras de la misma IP se afecten entre si mas de lo necesario.
    if user is not None:
        return f"user:{user.id}"
    return f"ip:{get_client_ip(request)}"


def check_rate_limit(request: Request, user: Optional[User] = None) -> None:
    # El limitador usa una ventana fija de un minuto porque es facil de razonar,
    # facil de depurar y suficientemente claro para los flujos actuales del proyecto.
    key = get_rate_limit_key(request, user)
    now_ts = int(time.time())
    window = 60
    bucket = RATE_BUCKETS.get(key)

    if not bucket or now_ts >= bucket["reset"]:
        # Si no hay bucket o la ventana ya expiro, se reinicia el contador.
        # El primer request de la nueva ventana entra y deja el bucket listo para los siguientes.
        RATE_BUCKETS[key] = {"count": 1, "reset": now_ts + window}
        return

    if bucket["count"] >= DEFAULT_RATE_LIMIT:
        # Cuando se supera el limite se corta inmediatamente con 429 y metadata interna
        # suficiente para que los logs distingan si el bloqueo fue por IP o por usuario.
        raise error_response(
            429,
            "Rate limit exceeded",
            internal={
                "event": "rate_limit.exceeded",
                "error_kind": "security",
                "limit_scope": "user" if user is not None else "ip",
            },
        )

    # Si el request aun cabe dentro de la ventana vigente, solo incrementa el contador.
    bucket["count"] += 1
