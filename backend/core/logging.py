"""Helpers de logging estructurado para consola y archivo rotado.

Este modulo define una politica de logs uniforme para todo el backend. La idea
es que tanto desarrollo local como ejecucion en servidores produzcan eventos
JSON faciles de leer, filtrar, correlacionar y almacenar.
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from typing import Any, Dict

from .config import LOG_FILE_PATH, LOG_LEVEL, LOG_TO_FILE


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        # Emite JSON plano para que los logs:
        # 1. se puedan filtrar con herramientas simples,
        # 2. mantengan un contrato estable entre modulos,
        # 3. puedan reenviarse luego a una plataforma externa sin transformar demasiado.
        payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        context = getattr(record, "context", None)
        if isinstance(context, dict):
            # El contexto extra se mezcla a nivel raiz para que request_id, event o actor
            # queden visibles sin tener que navegar estructuras anidadas.
            payload.update(context)

        if record.exc_info:
            # Cuando hay excepcion se agrega el trace formateado para diagnostico.
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, ensure_ascii=True)


def build_stream_handler() -> logging.Handler:
    # La consola es la salida base porque funciona bien tanto en desarrollo como en contenedores,
    # systemd, servicios y cualquier runtime donde stdout/stderr sea el canal principal de observacion.
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    return handler


def build_file_handler() -> logging.Handler:
    # El archivo rotado es opcional, pero resulta util cuando se necesita:
    # - revisar historico local,
    # - depurar problemas que ya pasaron,
    # - conservar logs aunque la terminal ya no muestre el buffer anterior.
    log_path = os.path.abspath(LOG_FILE_PATH)
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    handler = RotatingFileHandler(log_path, maxBytes=1_048_576, backupCount=3, encoding="utf-8")
    handler.setFormatter(JsonFormatter())
    return handler


def configure_logging() -> None:
    # Toda la jerarquia "inventory.*" cuelga de este logger base.
    # Configurarlo una sola vez evita resultados inconsistentes entre modulos.
    base_logger = logging.getLogger("inventory")
    if getattr(base_logger, "_inventory_configured", False):
        # Evita handlers duplicados cuando varios modulos importan el logger.
        return

    # El nivel sale de configuracion para poder endurecer o relajar verbosidad por entorno.
    base_logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))
    base_logger.handlers.clear()
    base_logger.addHandler(build_stream_handler())

    if LOG_TO_FILE:
        # El archivo se agrega como segundo destino sin reemplazar la consola.
        base_logger.addHandler(build_file_handler())

    # propagate = False evita duplicados si el root logger del proceso tambien esta configurado.
    base_logger.propagate = False
    base_logger._inventory_configured = True  # type: ignore[attr-defined]


def get_logger(name: str) -> logging.Logger:
    # Garantiza que cualquier logger pedido salga con la configuracion base aplicada.
    configure_logging()
    return logging.getLogger(name)
