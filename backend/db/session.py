"""Engine de base de datos y manejo de sesiones SQLAlchemy.

Este modulo define la infraestructura minima de persistencia compartida por todo
el backend: engine, factory de sesiones y base declarativa para los modelos.
"""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from ..core.config import DATABASE_URL, get_engine_kwargs


# El engine se crea una sola vez a nivel de modulo para que toda la aplicacion
# comparta el mismo punto de acceso a la base y la misma configuracion del driver.
engine = create_engine(DATABASE_URL, **get_engine_kwargs())
# SessionLocal funciona como factory de sesiones cortas para requests y scripts.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base es la raiz declarativa sobre la que se registran todos los modelos ORM.
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    # Entrega una sesion por request o por uso puntual en dependencias FastAPI.
    # El patron yield/finally garantiza cierre incluso si la ruta falla con excepcion.
    db = SessionLocal()
    try:
        yield db
    finally:
        # Cerrar aqui evita fugas de conexiones o sesiones colgadas entre requests.
        db.close()
