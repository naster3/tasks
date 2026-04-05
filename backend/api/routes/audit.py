"""Endpoints de auditoria para inspeccionar el historial de productos.

Este modulo expone la lectura de la bitacora asociada a un item. La auditoria
guarda eventos de negocio como creacion, edicion, archivado, restauracion y
movimientos, incluyendo actor, nota y snapshots antes/despues cuando aplica.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.security import require_user
from ...db.models import AuditLog, User
from ...db.session import get_db
from ...services.inventory import get_item_or_404
from ...services.serializers import audit_to_dict

router = APIRouter(tags=["audit"])


@router.get("/items/{item_id}/audit")
def list_audit(
    item_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_user(["admin", "operador", "solo_lectura"])),
):
    # Primero valida que el item exista. Si no existe, reutilizamos el mismo 404
    # centralizado que usa el resto del backend para no tener mensajes o flujos
    # distintos entre endpoints relacionados al mismo recurso.
    get_item_or_404(db, item_id)

    # Despues consultamos solo las filas de auditoria del item solicitado.
    # El orden descendente por fecha hace que el frontend reciba primero los
    # eventos mas recientes, que es la forma natural de mostrar una bitacora.
    audit_entries = db.query(AuditLog).filter(AuditLog.item_id == item_id).order_by(AuditLog.created_at.desc()).all()

    # La respuesta se serializa con un helper comun para mantener el mismo
    # contrato JSON aunque cambie la implementacion interna del modelo ORM.
    return [audit_to_dict(entry) for entry in audit_entries]
