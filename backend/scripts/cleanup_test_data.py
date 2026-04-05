"""Elimina datos de prueba sembrados sin tocar registros reales."""

import json

from ..db.models import AuditLog, Item, Movement, Token, User
from ..db.session import SessionLocal
from .common import prepare_database
from .test_data_utils import TEST_ITEM_NOTE_PREFIX, TEST_MOVEMENT_NOTE_PREFIX, TEST_PRODUCT_PREFIX, TEST_USER_PREFIX


def main() -> None:
    prepare_database()
    db = SessionLocal()

    try:
        # Reune ids primero para poder ordenar los borrados masivos con seguridad.
        test_usernames = [
            username for (username,) in db.query(User.username).filter(User.username.like(f"{TEST_USER_PREFIX}%")).all()
        ]
        test_item_ids = [
            item_id for (item_id,) in db.query(Item.id).filter(Item.sku.like(f"{TEST_PRODUCT_PREFIX}%")).all()
        ]
        test_user_ids = [
            user_id for (user_id,) in db.query(User.id).filter(User.username.like(f"{TEST_USER_PREFIX}%")).all()
        ]

        deleted_tokens = 0
        deleted_audit_logs = 0
        deleted_movements = 0
        deleted_items = 0
        deleted_users = 0

        if test_user_ids:
            deleted_tokens = db.query(Token).filter(Token.user_id.in_(test_user_ids)).delete(synchronize_session=False)

        if test_item_ids:
            # Borra dependencias antes de eliminar los items padre.
            deleted_audit_logs += (
                db.query(AuditLog).filter(AuditLog.item_id.in_(test_item_ids)).delete(synchronize_session=False)
            )
            deleted_movements += (
                db.query(Movement).filter(Movement.item_id.in_(test_item_ids)).delete(synchronize_session=False)
            )
            deleted_items = db.query(Item).filter(Item.id.in_(test_item_ids)).delete(synchronize_session=False)

        deleted_audit_logs += (
            db.query(AuditLog)
            .filter(AuditLog.note.like(f"{TEST_ITEM_NOTE_PREFIX}%") | AuditLog.note.like(f"{TEST_MOVEMENT_NOTE_PREFIX}%"))
            .delete(synchronize_session=False)
        )
        deleted_movements += (
            db.query(Movement)
            .filter(Movement.note.like(f"{TEST_ITEM_NOTE_PREFIX}%") | Movement.note.like(f"{TEST_MOVEMENT_NOTE_PREFIX}%"))
            .delete(synchronize_session=False)
        )

        if test_usernames:
            deleted_users = (
                db.query(User).filter(User.username.like(f"{TEST_USER_PREFIX}%")).delete(synchronize_session=False)
            )

        db.commit()
        # Imprime JSON para inspeccion manual o consumo desde tooling.
        print(
            json.dumps(
                {
                    "deleted_tokens": deleted_tokens,
                    "deleted_audit_logs": deleted_audit_logs,
                    "deleted_movements": deleted_movements,
                    "deleted_items": deleted_items,
                    "deleted_users": deleted_users,
                },
                ensure_ascii=True,
            )
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
