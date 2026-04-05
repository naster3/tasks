"""Modelos SQLAlchemy para usuarios, items, movimientos y auditoria.

Este modulo define la estructura persistida del backend. El diseño separa la
ficha del item de sus movimientos para que el stock sea reconstruible, auditable
y coherente con la historia completa del inventario.
"""

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .session import Base


def now_utc() -> datetime:
    # Centralizar la hora mantiene consistentes los defaults y evita mezclar llamadas dispersas a datetime.utcnow().
    return datetime.utcnow()


class User(Base):
    """Usuario de la aplicacion con rol usado para autorizacion en rutas.

    El modelo se mantiene pequeno porque la app hoy solo necesita identidad,
    password hash y rol. Si luego se agregan perfiles o preferencias, podrian
    vivir aqui o en tablas relacionadas segun la complejidad.
    """

    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=now_utc)


class Token(Base):
    """Bearer token persistido asociado a un usuario y a una expiracion.

    Persistir tokens permite validar sesiones desde base de datos, controlar
    expiracion y abrir la puerta a futuras revocaciones.
    """

    __tablename__ = "token"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User")


class Item(Base):
    """Item de inventario cuya existencia es independiente del stock calculado.

    La ficha almacena identidad comercial y metadatos operativos del producto.
    El stock no se guarda aqui: se deriva de los movimientos para mantener la
    trazabilidad y evitar desincronizacion entre contador e historial.
    """

    __tablename__ = "item"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(64), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(120), nullable=False)
    size = Column(String(40))
    color = Column(String(80))
    price = Column(Float, nullable=False, default=0)
    location = Column(String(120), nullable=False)
    created_at = Column(DateTime, default=now_utc)
    created_by = Column(String(80), nullable=False)
    updated_at = Column(DateTime, default=now_utc)
    updated_by = Column(String(80), nullable=False)
    archived_at = Column(DateTime)
    archived_by = Column(String(80))

    # selectin permite traer movimientos por lote y evita el costo de consultas
    # perezosas repetidas cuando se listan o serializan multiples items.
    movements = relationship("Movement", back_populates="item", cascade="all, delete-orphan", lazy="selectin")


class Movement(Base):
    """Evento de cambio de stock que afecta el nivel calculado del item.

    Cada fila representa una operacion de inventario: entrada, salida,
    devolucion o ajuste. El stock se obtiene sumando estas filas segun reglas
    del dominio, no leyendo un campo acumulado.
    """

    __tablename__ = "movement"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("item.id"), nullable=False)
    type = Column(String(20), nullable=False)
    qty = Column(Integer, nullable=False)
    note = Column(String(255))
    created_at = Column(DateTime, default=now_utc)
    created_by = Column(String(80), nullable=False)

    item = relationship("Item", back_populates="movements")


class AuditLog(Base):
    """Registro de auditoria para el ciclo de vida del item y sus cambios de stock.

    A diferencia de Movement, esta tabla no representa inventario fisico sino
    eventos de negocio observables: creacion, edicion, archivado, restauracion
    y cambios de stock con snapshots antes/despues cuando corresponde.
    """

    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, nullable=False)
    action = Column(String(40), nullable=False)
    actor = Column(String(80), nullable=False)
    note = Column(String(255))
    before = Column(JSON)
    after = Column(JSON)
    created_at = Column(DateTime, default=now_utc)
