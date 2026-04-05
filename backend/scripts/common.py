"""Helpers compartidos usados por scripts de mantenimiento y de siembra."""

from pathlib import Path

from ..db.session import Base, engine


def prepare_database() -> None:
    # Los scripts pueden ejecutarse sobre una base nueva, por eso crean tablas bajo demanda.
    Base.metadata.create_all(bind=engine)


def fixture_path(filename: str) -> Path:
    # Los fixtures viven en scripts/fixtures para separar codigo runtime y datos de prueba.
    return Path(__file__).resolve().parent / "fixtures" / filename
