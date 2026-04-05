"""Rutas de autenticacion para acceso basado en token.

Este modulo concentra el inicio de sesion. Su trabajo es validar credenciales,
emitir un token persistido y registrar eventos de seguridad y de negocio sin
filtrar detalles sensibles al cliente.
"""

import uuid
from datetime import timedelta
from typing import Any, Dict, Optional, cast

from fastapi import APIRouter, Body, Depends, Request
from sqlalchemy.orm import Session
from werkzeug.security import check_password_hash

from ...api.common import log_business_event, logger
from ...db.models import Token, User, now_utc
from ...db.session import get_db
from ...services.errors import error_response
from ...services.rate_limit import check_rate_limit

router = APIRouter(prefix="/auth", tags=["auth"])


def user_password_hash(user: User) -> str:
    # Este cast mantiene el tipado estable mientras el modelo sigue usando columnas SQLAlchemy clasicas.
    return cast(str, user.password_hash)


@router.post("/login")
def login(
    request: Request,
    payload: Optional[Dict[str, Any]] = Body(default=None),
    db: Session = Depends(get_db),
):
    # Login acepta un diccionario crudo porque el frontend actual aun no envia un esquema Pydantic formal.
    # Antes de tocar la base de datos se aplica rate limit para que incluso los intentos fallidos cuenten.
    check_rate_limit(request)
    payload = payload or {}
    username = str(payload.get("username") or "").strip()
    password = payload.get("password") or ""

    # La busqueda se hace por username y, si no existe usuario, se sigue un camino equivalente
    # al de clave incorrecta para evitar diferencias obvias entre "usuario inexistente" y "clave invalida".
    user = db.query(User).filter(User.username == username).first()
    password_hash = user_password_hash(user) if user else ""
    if not user or not check_password_hash(password_hash, password):
        # Los fallos de autenticacion se registran sin exponer detalles de la clave.
        logger.warning(
            "Authentication failed",
            extra={"context": {"event": "auth.login.failed", "username": username or None}},
        )
        raise error_response(401, "Invalid credentials")

    token_value = uuid.uuid4().hex
    # El token se persiste con vencimiento para que el backend pueda:
    # 1. validar sesiones contra base de datos,
    # 2. aplicar roles desde el usuario relacionado,
    # 3. soportar futuras revocaciones o limpieza.
    db.add(Token(token=token_value, user_id=user.id, expires_at=now_utc() + timedelta(hours=24)))
    db.commit()

    # El evento de negocio se registra despues del commit para no reportar un login exitoso que no exista en DB.
    log_business_event(
        request,
        "auth.login.succeeded",
        actor=user.username,
        role=cast(str, user.role),
    )

    # La respuesta es minima a proposito: solo entrega token y rol, que es lo necesario para el frontend.
    return {"token": token_value, "role": cast(str, user.role)}
