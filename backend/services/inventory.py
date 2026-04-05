"""Helpers del dominio de inventario para stock, auditoria y busqueda de items.

Este modulo concentra reglas de dominio reutilizadas por rutas y scripts:
como se interpreta un movimiento, como se calcula el stock disponible, como se
construyen eventos de auditoria y como se obtiene un item con sus movimientos.
"""

from datetime import datetime
from typing import Any, Optional, cast

from fastapi import HTTPException
from sqlalchemy.orm import Session, selectinload

from ..db.models import AuditLog, Item, Movement, now_utc


def movement_qty(movement: Movement) -> int:
    # Los modelos todavia no usan mapped typing moderno, asi que encapsulamos el cast.
    return cast(int, movement.qty)


def movement_type(movement: Movement) -> str:
    # Igual que movement_qty, evita repetir casts directos en cada llamada.
    return cast(str, movement.type)


def compute_status(stock: int) -> str:
    # Las etiquetas de estado son deliberadamente simples porque el frontend las
    # usa tal cual en tablas y badges. Cualquier cambio aqui impacta la UI.
    if stock == 0:
        return "Agotado"
    if stock < 10:
        return "Bajo stock"
    return "Disponible"


def movement_delta(movement: Movement) -> int:
    # Convierte el tipo de movimiento en un delta firmado:
    # - salida resta,
    # - ajuste usa el valor tal cual porque puede sumar o restar,
    # - entrada y devolucion suman en valor absoluto.
    qty = movement_qty(movement)
    movement_kind = movement_type(movement)
    if movement_kind == "salida":
        return -abs(qty)
    if movement_kind == "ajuste":
        return qty
    return abs(qty)


def compute_stock(movements: list[Movement]) -> int:
    # El stock se deriva siempre de los movimientos para evitar inconsistencias
    # entre un contador persistido y la historia real de entradas/salidas.
    return sum(movement_delta(movement) for movement in movements)


def create_audit(action: str, actor: str, before: Any, after: Any, note: str, item_id: int) -> AuditLog:
    # Centraliza la construccion de auditoria para que scripts, endpoints y futuras
    # tareas batch registren exactamente la misma estructura de evento.
    return AuditLog(
        action=action,
        actor=actor,
        before=before,
        after=after,
        note=note,
        item_id=item_id,
        created_at=now_utc(),
    )


def get_item_or_404(db: Session, item_id: int) -> Item:
    # La consulta precarga movimientos porque muchos callers necesitan calcular stock,
    # validar reglas de inventario o serializar el item inmediatamente despues.
    item = db.query(Item).options(selectinload(Item.movements)).filter(Item.id == item_id).first()
    if item is None:
        # Se usa HTTPException porque este helper se consume desde rutas FastAPI.
        raise HTTPException(status_code=404, detail="Item not found")
    return item


def item_datetime(value: Any) -> datetime:
    # Helper de cast para timestamps leidos desde modelos SQLAlchemy clasicos.
    return cast(datetime, value)


def optional_item_datetime(value: Any) -> Optional[datetime]:
    # Variante nullable usada principalmente para archived_at.
    return cast(Optional[datetime], value)


def item_price(value: Any) -> float:
    # Helper de cast para mantener serializacion y calculos con precio tipado.
    return cast(float, value)
