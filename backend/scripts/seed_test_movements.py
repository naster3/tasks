"""Genera historial determinista de movimientos para productos de prueba."""

import json
from typing import cast

from ..db.models import Item, Movement, User
from ..db.session import SessionLocal
from ..services.inventory import compute_stock, create_audit
from .common import prepare_database
from .test_data_utils import TEST_MOVEMENT_NOTE_PREFIX, TEST_PRODUCT_PREFIX, build_seed_movement_note, timestamp_now


def item_id_of(item: Item) -> int:
    # Convierte el id ORM del item a entero estricto para llamadas tipadas.
    return cast(int, item.id)


def movement_plan(index: int) -> list[tuple[str, int, str]]:
    # Un plan repetible hace que los fixtures sean previsibles entre ejecuciones.
    plans = [
        [("salida", 2, "Venta mostrador"), ("entrada", 4, "Reposicion semanal")],
        [("salida", 3, "Venta online"), ("devolucion", 1, "Devolucion cliente")],
        [("salida", 1, "Reserva pickup"), ("ajuste", 2, "Ajuste inventario")],
        [("entrada", 5, "Ingreso proveedor"), ("salida", 2, "Venta tienda")],
        [("salida", 4, "Promocion outlet"), ("ajuste", -1, "Correccion conteo")],
    ]
    return plans[(index - 1) % len(plans)]


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

        items = db.query(Item).filter(Item.sku.like(f"{TEST_PRODUCT_PREFIX}%")).order_by(Item.sku.asc()).all()
        if not items:
            raise RuntimeError("No hay productos de prueba. Ejecuta seed_test_products.py primero.")

        created_movements = 0
        skipped_items = 0

        for index, item in enumerate(items, start=1):
            resolved_item_id = item_id_of(item)
            # Omite items ya sembrados para mantener el script idempotente.
            already_seeded = (
                db.query(Movement.id)
                .filter(Movement.item_id == resolved_item_id)
                .filter(Movement.note.like(f"{TEST_MOVEMENT_NOTE_PREFIX}%"))
                .first()
            )
            if already_seeded:
                skipped_items += 1
                continue

            current_stock = compute_stock(item.movements)
            actor = actors[(index - 1) % len(actors)]

            for move_type, raw_qty, label in movement_plan(index):
                now = timestamp_now()
                qty = raw_qty

                if move_type == "salida":
                    # Ajusta las salidas para que los fixtures nunca dejen stock negativo.
                    qty = min(raw_qty, max(1, current_stock))
                    delta = -abs(qty)
                elif move_type == "ajuste":
                    # Corrige ajustes cuando el plan bruto volveria invalido el stock.
                    if current_stock + qty < 0:
                        qty = -current_stock + 1 if current_stock > 0 else 1
                    delta = qty
                else:
                    delta = abs(qty)

                db.add(
                    Movement(
                        item_id=resolved_item_id,
                        type=move_type,
                        qty=qty,
                        note=build_seed_movement_note(label),
                        created_at=now,
                        created_by=actor,
                    )
                )
                db.add(
                    create_audit(
                        "movimiento",
                        actor,
                        {"stock": current_stock},
                        {"stock": current_stock + delta},
                        build_seed_movement_note(f"{move_type} {qty}"),
                        resolved_item_id,
                    )
                )

                current_stock += delta
                created_movements += 1

            db.flush()

        db.commit()
        print(
            json.dumps(
                {
                    "created_movements": created_movements,
                    "skipped_items": skipped_items,
                    "seeded_items": len(items) - skipped_items,
                },
                ensure_ascii=True,
            )
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
