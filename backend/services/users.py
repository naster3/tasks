"""Helpers de siembra de usuarios para primer arranque y desarrollo local."""

import os

from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash

from ..core.config import APP_ENV
from ..db.models import User


def seed_users(db: Session) -> None:
    # Omite la siembra si ya existe algun usuario para evitar duplicados iniciales.
    if db.query(User).count() > 0:
        return

    admin_password = os.environ.get("ADMIN_PASSWORD")
    operator_password = os.environ.get("OPERATOR_PASSWORD")
    readonly_password = os.environ.get("READONLY_PASSWORD")

    if APP_ENV == "production" and (not admin_password or not operator_password or not readonly_password):
        # Produccion exige credenciales explicitas para evitar claves por defecto accidentales.
        raise RuntimeError(
            "ADMIN_PASSWORD, OPERATOR_PASSWORD y READONLY_PASSWORD son obligatorios en produccion."
        )

    admin_password = admin_password or "admin123"
    operator_password = operator_password or "operator123"
    readonly_password = readonly_password or "readonly123"

    db.add_all(
        # Los tres roles por defecto reflejan las autorizaciones usadas por la API.
        [
            User(username="admin", password_hash=generate_password_hash(admin_password), role="admin"),
            User(username="operador", password_hash=generate_password_hash(operator_password), role="operador"),
            User(username="lector", password_hash=generate_password_hash(readonly_password), role="solo_lectura"),
        ]
    )
    db.commit()
