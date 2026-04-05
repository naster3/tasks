"""Rutas de movimientos de inventario y consulta de historial.

Este modulo encapsula los cambios de stock. Toda entrada, salida, devolucion o
ajuste pasa por aqui para que las reglas de validacion y la auditoria del stock
se apliquen de forma consistente.
"""

from typing import Any, Dict, Optional, cast

from fastapi import APIRouter, Body, Depends, Request
from sqlalchemy.orm import Session

from ...api.common import log_business_event, username_of
from ...core.security import require_user
from ...db.models import Movement, User, now_utc
from ...db.session import get_db
from ...services.cache import clear_cache
from ...services.errors import error_response
from ...services.inventory import compute_stock, create_audit, get_item_or_404
from ...services.serializers import movement_to_dict
from ...services.validation import parse_integer

router = APIRouter(tags=["movements"])


def item_id_of(item: Any) -> int:
    # Encapsula el cast del id ORM para llamadas que requieren un entero real.
    return cast(int, item.id)


@router.post("/movements")
def create_movement(
    request: Request,
    payload: Optional[Dict[str, Any]] = Body(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_user(["admin", "operador"])),
):
    actor = username_of(user)
    payload = payload or {}
    # El endpoint acepta diccionarios crudos para seguir alineado con el frontend actual.
    # Por eso cada campo critico se valida manualmente antes de afectar inventario.
    raw_item_id = payload.get("item_id")
    raw_qty = payload.get("qty")
    movement_type = payload.get("type")

    if raw_item_id is None or movement_type not in ["entrada", "salida", "ajuste", "devolucion"]:
        raise error_response(
            400,
            "Invalid payload",
            internal={"event": "inventory.movement.validation_failed", "error_kind": "validation"},
        )
    if raw_qty is None:
        raise error_response(
            400,
            "Missing qty",
            internal={"event": "inventory.movement.validation_failed", "error_kind": "validation", "field": "qty"},
        )

    qty = parse_integer(raw_qty, "qty")
    # "ajuste" permite positivos y negativos, pero el resto de movimientos requiere cantidades estrictamente positivas.
    if movement_type != "ajuste" and qty <= 0:
        raise error_response(
            400,
            "Invalid qty",
            internal={"event": "inventory.movement.validation_failed", "error_kind": "validation", "field": "qty"},
        )
    if movement_type == "ajuste" and qty == 0:
        raise error_response(
            400,
            "Invalid qty",
            internal={"event": "inventory.movement.validation_failed", "error_kind": "validation", "field": "qty"},
        )

    item_id = parse_integer(raw_item_id, "item_id")
    item = get_item_or_404(db, item_id)
    resolved_item_id = item_id_of(item)
    if item.archived_at is not None:
        # Los items archivados no aceptan cambios de stock hasta ser restaurados.
        raise error_response(
            400,
            "Item archived",
            internal={
                "event": "inventory.movement.rejected",
                "error_kind": "business_rule",
                "item_id": resolved_item_id,
            },
        )

    # El stock actual se calcula desde movimientos existentes; no se confia en un contador persistido aparte.
    current_stock = compute_stock(item.movements)
    delta = qty if movement_type == "ajuste" else abs(qty)
    if movement_type == "salida":
        delta = -abs(qty)

    if current_stock + delta < 0:
        # El stock negativo se bloquea aqui en vez de depender de reconciliaciones posteriores.
        raise error_response(
            400,
            "Stock would be negative",
            internal={
                "event": "inventory.movement.rejected",
                "error_kind": "business_rule",
                "item_id": resolved_item_id,
                "qty": qty,
                "movement_type": movement_type,
                "current_stock": current_stock,
            },
        )

    # Primero se registra el movimiento fisico/logico que explica el cambio de stock.
    db.add(
        Movement(
            item_id=resolved_item_id,
            type=movement_type,
            qty=qty,
            note=str(payload.get("note") or "").strip() or None,
            created_at=now_utc(),
            created_by=actor,
        )
    )
    # Luego se guarda auditoria con before/after para poder reconstruir el impacto del evento.
    db.add(
        create_audit(
            "movimiento",
            actor,
            {"stock": current_stock},
            {"stock": current_stock + delta},
            f"{movement_type} {qty}",
            resolved_item_id,
        )
    )
    db.commit()

    # Como el stock visible cambia, se invalida el cache de listados de items.
    clear_cache()
    log_business_event(
        request,
        "inventory.movement.created",
        actor=actor,
        item_id=resolved_item_id,
        movement_type=movement_type,
        qty=qty,
        resulting_stock=current_stock + delta,
    )
    return {"status": "ok"}


@router.get("/items/{item_id}/movements")
def list_movements(
    item_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_user(["admin", "operador", "solo_lectura"])),
):
    item = get_item_or_404(db, item_id)
    resolved_item_id = item_id_of(item)
    # Los movimientos se devuelven del mas reciente al mas antiguo porque la UI los consume como feed.
    movements = db.query(Movement).filter(Movement.item_id == resolved_item_id).order_by(Movement.created_at.desc()).all()
    # La serializacion se delega a un helper comun para mantener el contrato de respuesta estable.
    return [movement_to_dict(movement) for movement in movements]
