"""Helpers de serializacion que convierten entidades ORM en payloads de API.

Este modulo fija el contrato externo de respuesta para items, movimientos y
auditoria. Mantener esta transformacion en un solo lugar evita que cada ruta
arme diccionarios a mano y termine divergendo en campos, formatos o nombres.
"""

from typing import Any, Dict

from ..db.models import AuditLog, Item, Movement
from .inventory import compute_status, compute_stock, item_datetime, item_price, optional_item_datetime


def item_to_dict(item: Item) -> Dict[str, Any]:
    # El item expuesto por la API mezcla datos persistidos y datos derivados.
    # Aqui se calculan stock y status para que el resto del backend no replique
    # esa logica cada vez que necesita devolver un item.
    stock = compute_stock(item.movements)
    created_at = item_datetime(item.created_at)
    updated_at = item_datetime(item.updated_at)
    archived_at = optional_item_datetime(item.archived_at)
    price = item_price(item.price)
    return {
        # Se devuelve el identificador y la ficha base del producto.
        "id": item.id,
        "sku": item.sku,
        "name": item.name,
        "category": item.category,
        "size": item.size,
        "color": item.color,
        # El precio se redondea a dos decimales para exponer un valor estable a la UI.
        "price": round(price, 2),
        "location": item.location,
        # Las fechas salen en ISO 8601 para que frontend y tooling las consuman sin ambiguedad.
        "created_at": created_at.isoformat(),
        "created_by": item.created_by,
        "updated_at": updated_at.isoformat(),
        "updated_by": item.updated_by,
        "archived_at": archived_at.isoformat() if archived_at is not None else None,
        "archived_by": item.archived_by,
        # Estos dos campos son derivados del historial de movimientos.
        "stock": stock,
        "status": compute_status(stock),
    }


def movement_to_dict(movement: Movement) -> Dict[str, Any]:
    # Los movimientos se devuelven planos porque el frontend los muestra como eventos
    # individuales dentro de una linea de tiempo o tabla simple.
    created_at = item_datetime(movement.created_at)
    return {
        "id": movement.id,
        "type": movement.type,
        "qty": movement.qty,
        "note": movement.note,
        "created_at": created_at.isoformat(),
        "created_by": movement.created_by,
    }


def audit_to_dict(entry: AuditLog) -> Dict[str, Any]:
    # La auditoria conserva before/after porque eso permite reconstruir el cambio
    # exacto y, si hace falta, renderizar diffs o inspeccionar historial con detalle.
    created_at = item_datetime(entry.created_at)
    return {
        "id": entry.id,
        "action": entry.action,
        "actor": entry.actor,
        "note": entry.note,
        "before": entry.before,
        "after": entry.after,
        "created_at": created_at.isoformat(),
    }
