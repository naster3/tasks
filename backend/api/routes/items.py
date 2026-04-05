"""Rutas CRUD de items y filtros del listado de inventario.

Este modulo concentra el ciclo de vida del item: listado, creacion, edicion,
archivado y restauracion. La idea es mantener juntas las reglas del recurso
principal de inventario y dejar los movimientos en su modulo especializado.
"""

from datetime import datetime
from typing import Any, Dict, Optional, cast

from fastapi import APIRouter, Body, Depends, Query, Request, status
from sqlalchemy.orm import Session, selectinload

from ...api.common import log_business_event, username_of
from ...core.security import require_user
from ...db.models import Item, Movement, User, now_utc
from ...db.session import get_db
from ...services.cache import cache_get, cache_set, clear_cache
from ...services.errors import error_response
from ...services.inventory import create_audit, get_item_or_404
from ...services.serializers import item_to_dict
from ...services.validation import parse_non_negative_float, parse_non_negative_int

router = APIRouter(tags=["items"])


def archived_at_of(item: Item) -> Optional[datetime]:
    # Helper pequeno para evitar repetir casts manuales en cada regla de negocio.
    return cast(Optional[datetime], item.archived_at)


def mutable_item(item: Item) -> Any:
    # Mientras los modelos no usen typing moderno de SQLAlchemy, este helper simplifica las asignaciones mutables.
    return cast(Any, item)


def item_id_of(item: Item) -> int:
    # Encapsula el cast del id del modelo para llamadas que esperan un entero estricto.
    return cast(int, item.id)


@router.get("/items")
def list_items(
    request: Request,
    q: str = Query(default=""),
    category: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    location: Optional[str] = Query(default=None),
    sort: str = Query(default="name"),
    archived: bool = Query(default=False),
    db: Session = Depends(get_db),
    _user: User = Depends(require_user(["admin", "operador", "solo_lectura"])),
):
    # El listado es una ruta de lectura intensiva, por eso intenta servir primero desde cache en memoria.
    # Si el cache existe, ya representa exactamente esa combinacion de path y query string.
    cached = cache_get(request)
    if cached is not None:
        return cached

    # Se precargan movimientos porque la serializacion del item calcula stock y estado a partir de ellos.
    items_query = db.query(Item).options(selectinload(Item.movements))
    if archived:
        items_query = items_query.filter(Item.archived_at.is_not(None))
    else:
        items_query = items_query.filter(Item.archived_at.is_(None))

    # Los filtros directos a columnas se resuelven en SQL para reducir el conjunto base antes de serializar.
    if category:
        items_query = items_query.filter(Item.category == category)
    if location:
        items_query = items_query.filter(Item.location == location)

    items = items_query.all()
    search = q.lower().strip()
    if search:
        # La busqueda se aplica en Python porque stock y estado se derivan de movimientos.
        items = [
            item
            for item in items
            if search in f"{item.name} {item.sku} {item.color or ''} {item.category} {item.location}".lower()
        ]

    results = [item_to_dict(item) for item in items]
    if status_filter:
        # El filtro por status ocurre despues porque "status" es un valor derivado, no una columna persistida.
        results = [item for item in results if item["status"] == status_filter]

    reverse = False
    sort_field = sort
    if sort.startswith("-"):
        reverse = True
        sort_field = sort[1:]

    if sort_field in ["name", "price", "stock"]:
        # Solo se permiten campos de orden definidos para evitar contratos ambiguos o errores silenciosos.
        results.sort(key=lambda item: item[sort_field], reverse=reverse)

    # El cache se escribe al final, cuando ya se aplicaron filtros, busqueda y ordenamiento.
    cache_set(request, results)
    return results


@router.post("/items", status_code=status.HTTP_201_CREATED)
def create_item(
    request: Request,
    payload: Optional[Dict[str, Any]] = Body(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_user(["admin", "operador"])),
):
    actor = username_of(user)
    payload = payload or {}
    # Los campos obligatorios se validan a mano porque el endpoint aun usa dicts crudos.
    required_fields = ["name", "sku", "category", "location"]
    missing = [field for field in required_fields if not str(payload.get(field) or "").strip()]
    if missing:
        raise error_response(
            400,
            "Missing fields",
            {"fields": missing},
            {"event": "inventory.item.create.validation_failed", "error_kind": "validation", "fields": missing},
        )

    sku = str(payload.get("sku") or "").strip().upper()
    # El SKU se normaliza a mayusculas para evitar duplicados semanticos con distinto casing.
    if db.query(Item).filter(Item.sku == sku).first():
        raise error_response(
            400,
            "SKU already exists",
            internal={"event": "inventory.item.create.conflict", "error_kind": "conflict", "sku": sku},
        )

    price = parse_non_negative_float(payload.get("price", 0), "price")
    timestamp = now_utc()

    # created_* y updated_* nacen iguales al crear el item porque aun no existe una modificacion posterior.
    item = Item(
        sku=sku,
        name=str(payload.get("name") or "").strip(),
        category=str(payload.get("category") or "").strip(),
        size=str(payload.get("size") or "").strip().upper() or None,
        color=str(payload.get("color") or "").strip() or None,
        price=price,
        location=str(payload.get("location") or "").strip(),
        created_at=timestamp,
        created_by=actor,
        updated_at=timestamp,
        updated_by=actor,
    )
    db.add(item)
    db.flush()
    created_item_id = item_id_of(item)

    # El stock inicial se registra como movimiento para:
    # 1. conservar coherencia historica,
    # 2. evitar una segunda fuente de verdad para stock,
    # 3. reutilizar las mismas reglas del resto de movimientos.
    initial_stock = parse_non_negative_int(payload.get("initial_stock", 0) or 0, "initial_stock")
    if initial_stock:
        db.add(
            Movement(
                item_id=created_item_id,
                type="entrada",
                qty=initial_stock,
                note="Stock inicial",
                created_at=now_utc(),
                created_by=actor,
            )
        )

    # La creacion del item tambien genera auditoria aunque no haya before/after, porque importa el evento inicial.
    db.add(create_audit("creado", actor, None, None, "Registro inicial", created_item_id))
    db.commit()
    db.refresh(item)

    # Toda operacion de escritura invalida el cache de listados.
    clear_cache()

    log_business_event(
        request,
        "inventory.item.created",
        actor=actor,
        item_id=created_item_id,
        sku=sku,
        initial_stock=initial_stock,
    )
    return item_to_dict(get_item_or_404(db, created_item_id))


@router.put("/items/{item_id}")
def update_item(
    request: Request,
    item_id: int,
    payload: Optional[Dict[str, Any]] = Body(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_user(["admin", "operador"])),
):
    actor = username_of(user)
    payload = payload or {}
    item = get_item_or_404(db, item_id)
    resolved_item_id = item_id_of(item)
    item_record = mutable_item(item)
    # Los items archivados son inmutables hasta restaurarse para mantener predecible la papelera.
    if archived_at_of(item) is not None:
        raise error_response(
            400,
            "Item archived",
            internal={
                "event": "inventory.item.update.rejected",
                "error_kind": "business_rule",
                "item_id": resolved_item_id,
            },
        )

    # El snapshot "before" se toma antes de mutar el ORM para poder construir una auditoria real del cambio.
    before = {
        "name": item.name,
        "sku": item.sku,
        "category": item.category,
        "size": item.size,
        "color": item.color,
        "price": item.price,
        "location": item.location,
    }

    sku = str(payload.get("sku", item.sku) or "").strip().upper()
    # Si el SKU cambia, se vuelve a validar unicidad para no colisionar con otro item existente.
    if sku != item.sku and db.query(Item).filter(Item.sku == sku).first():
        raise error_response(
            400,
            "SKU already exists",
            internal={
                "event": "inventory.item.update.conflict",
                "error_kind": "conflict",
                "item_id": resolved_item_id,
                "sku": sku,
            },
        )

    price = parse_non_negative_float(payload.get("price", item.price), "price")

    # Las mutaciones se aplican sobre el mismo objeto ORM ya cargado para que SQLAlchemy detecte el diff.
    item_record.name = str(payload.get("name") or item.name).strip()
    item_record.sku = sku
    item_record.category = str(payload.get("category") or item.category).strip()
    item_record.size = str(payload.get("size") or item.size or "").strip().upper() or None
    item_record.color = str(payload.get("color") or item.color or "").strip() or None
    item_record.price = price
    item_record.location = str(payload.get("location") or item.location).strip()
    item_record.updated_at = now_utc()
    item_record.updated_by = actor

    after = {
        "name": item.name,
        "sku": item.sku,
        "category": item.category,
        "size": item.size,
        "color": item.color,
        "price": item.price,
        "location": item.location,
    }

    if before != after:
        # Solo se crea auditoria cuando realmente hubo un cambio.
        db.add(create_audit("edicion", actor, before, after, "Actualizacion de ficha", resolved_item_id))

    db.commit()
    # Incluso si no hubo cambios materiales, el endpoint invalida cache para mantener comportamiento uniforme.
    clear_cache()
    log_business_event(
        request,
        "inventory.item.updated",
        actor=actor,
        item_id=resolved_item_id,
        sku=sku,
        changed=before != after,
    )
    return item_to_dict(get_item_or_404(db, resolved_item_id))


@router.delete("/items/{item_id}")
def archive_item(
    request: Request,
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_user(["admin"])),
):
    actor = username_of(user)
    item = get_item_or_404(db, item_id)
    resolved_item_id = item_id_of(item)
    item_record = mutable_item(item)
    # La eliminacion se implementa como archivado para que datos y auditoria sigan recuperables.
    if archived_at_of(item) is not None:
        raise error_response(
            400,
            "Already archived",
            internal={
                "event": "inventory.item.archive.rejected",
                "error_kind": "business_rule",
                "item_id": resolved_item_id,
            },
        )

    # Archivar solo marca metadatos; no borra movimientos ni auditoria historica.
    item_record.archived_at = now_utc()
    item_record.archived_by = actor
    item_record.updated_at = now_utc()
    item_record.updated_by = actor

    db.add(create_audit("archivado", actor, None, None, "Enviado a papelera", resolved_item_id))
    db.commit()
    clear_cache()
    log_business_event(
        request,
        "inventory.item.archived",
        actor=actor,
        item_id=resolved_item_id,
    )
    return {"status": "archived"}


@router.post("/items/{item_id}/restore")
def restore_item(
    request: Request,
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_user(["admin"])),
):
    actor = username_of(user)
    item = get_item_or_404(db, item_id)
    resolved_item_id = item_id_of(item)
    item_record = mutable_item(item)
    # Restaurar limpia el metadato de archivo pero conserva intacta la auditoria historica.
    if archived_at_of(item) is None:
        raise error_response(
            400,
            "Not archived",
            internal={
                "event": "inventory.item.restore.rejected",
                "error_kind": "business_rule",
                "item_id": resolved_item_id,
            },
        )

    # Restaurar revierte solo el estado de archivado; no altera stock ni reescribe eventos previos.
    item_record.archived_at = None
    item_record.archived_by = None
    item_record.updated_at = now_utc()
    item_record.updated_by = actor

    db.add(create_audit("restaurado", actor, None, None, "Recuperado de papelera", resolved_item_id))
    db.commit()
    clear_cache()
    log_business_event(
        request,
        "inventory.item.restored",
        actor=actor,
        item_id=resolved_item_id,
    )
    return {"status": "restored"}
