"""Siembra usuarios fixture para pruebas de permisos e inicio de sesion."""

import json
from collections import Counter

from werkzeug.security import generate_password_hash

from ..db.models import User, now_utc
from ..db.session import SessionLocal
from .common import fixture_path, prepare_database


def load_fixture() -> list[dict]:
    # Los fixtures JSON se mantienen simples para que tambien los editen herramientas no Python.
    fixture_file = fixture_path("test-users.json")
    with fixture_file.open("r", encoding="utf-8") as fixture_handle:
        data = json.load(fixture_handle)

    if not isinstance(data, list):
        raise ValueError("test-users.json debe contener una lista de usuarios.")

    return data


def main() -> None:
    prepare_database()
    users = load_fixture()
    db = SessionLocal()

    try:
        existing_usernames = {username for (username,) in db.query(User.username).all()}
        created = 0
        skipped = 0
        created_by_role = Counter()

        for user_data in users:
            # Claves extra como _comment se ignoran; si faltan campos obligatorios se omite el registro.
            username = str(user_data.get("username") or "").strip()
            password = str(user_data.get("password") or "").strip()
            role = str(user_data.get("role") or "").strip()

            if not username or not password or role not in {"admin", "operador", "solo_lectura"}:
                skipped += 1
                continue

            if username in existing_usernames:
                # Los usuarios duplicados se omiten para mantener la siembra idempotente.
                skipped += 1
                continue

            db.add(
                User(
                    username=username,
                    password_hash=generate_password_hash(password),
                    role=role,
                    created_at=now_utc(),
                )
            )
            existing_usernames.add(username)
            created += 1
            created_by_role[role] += 1

        db.commit()
        total_users = db.query(User).count()
        print(
            json.dumps(
                {
                    "created": created,
                    "skipped": skipped,
                    "created_by_role": dict(created_by_role),
                    "total_users": total_users,
                },
                ensure_ascii=True,
            )
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
