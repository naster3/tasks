"""Siembra un catalogo determinista de productos de prueba con stock inicial."""

import json
from collections import Counter
from typing import cast

from ..db.models import Item, Movement, User
from ..db.session import SessionLocal
from ..services.inventory import create_audit
from .common import prepare_database
from .test_data_utils import (
    TEST_PRODUCT_PREFIX,
    build_initial_item_audit_note,
    build_initial_stock_note,
    iter_test_products,
    timestamp_now,
)


def item_id_of(item: Item) -> int:
    # Convierte el id ORM del item a entero estricto para auditoria y movimientos.
    return cast(int, item.id)


def main() -> None:
    prepare_database()
    db = SessionLocal()

    try:
        actors = [
            username
            for (username,) in db.query(User.username)
            .filter((User.username.like("test_admin_%")) | (User.username.like("test_operator_%")))
            .order_by(User.username.asc())
            .all()
        ]

        if not actors:
            raise RuntimeError("No hay usuarios de prueba admin/operador. Ejecuta seed_test_users.py primero.")

        existing_skus = {sku for (sku,) in db.query(Item.sku).filter(Item.sku.like(f"{TEST_PRODUCT_PREFIX}%")).all()}
        created = 0
        skipped = 0
        created_by_category = Counter()

        for index, product in enumerate(iter_test_products(), start=1):
            sku = product["sku"]
            if sku in existing_skus:
                # Los SKU ya existentes se omiten para poder reejecutar el script sin riesgo.
                skipped += 1
                continue

            actor = actors[(index - 1) % len(actors)]
            now = timestamp_now()

            item = Item(
                sku=sku,
                name=product["name"],
                category=product["category"],
                size=product["size"],
                color=product["color"],
                price=product["price"],
                location=product["location"],
                created_at=now,
                created_by=actor,
                updated_at=now,
                updated_by=actor,
            )
            db.add(item)
            db.flush()
            created_item_id = item_id_of(item)

            # El stock inicial se registra como movimiento para preservar el historial.
            db.add(
                Movement(
                    item_id=created_item_id,
                    type="entrada",
                    qty=product["initial_stock"],
                    note=build_initial_stock_note(),
                    created_at=now,
                    created_by=actor,
                )
            )
            db.add(
                create_audit(
                    "creado",
                    actor,
                    None,
                    None,
                    build_initial_item_audit_note(),
                    created_item_id,
                )
            )

            existing_skus.add(sku)
            created += 1
            created_by_category[product["category"]] += 1

        db.commit()
        # Emite un resumen compacto facil de leer y de usar desde automatizacion.
        print(
            json.dumps(
                {
                    "created": created,
                    "skipped": skipped,
                    "created_by_category": dict(created_by_category),
                    "total_seeded_items": db.query(Item).filter(Item.sku.like(f"{TEST_PRODUCT_PREFIX}%")).count(),
                },
                ensure_ascii=True,
            )
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
