"""Cache en memoria de respuestas para endpoints con muchas lecturas.

Este cache es deliberadamente simple y vive solo dentro del proceso actual.
Sirve para aliviar lecturas repetidas del listado de items, pero no pretende ser
un cache distribuido ni un reemplazo de una capa externa como Redis.
"""

import time
from typing import Any, Dict, Optional

from fastapi import Request

from ..core.config import CACHE_TTL_SECONDS

CACHE: Dict[str, Dict[str, Any]] = {}


def cache_key(request: Request) -> str:
    # La llave usa path + query string para distinguir cada combinacion de filtros,
    # ordenamientos o banderas del listado sin tener que inventar una clave manual.
    return f"{request.url.path}?{request.url.query}"


def cache_get(request: Request) -> Optional[Any]:
    # Si no hay entrada, el caller simplemente sigue el flujo normal contra la base.
    key = cache_key(request)
    cached = CACHE.get(key)
    if not cached:
        return None
    if cached["expires_at"] < time.time():
        # Las entradas vencidas se eliminan al leer para no necesitar un proceso aparte
        # de limpieza. Para el volumen actual, esta estrategia es suficiente.
        CACHE.pop(key, None)
        return None
    # Se devuelve el valor ya serializado, listo para salir como respuesta.
    return cached["value"]


def cache_set(request: Request, value: Any) -> None:
    # El TTL se calcula al guardar para que cada entrada sea autonomamente expirable.
    CACHE[cache_key(request)] = {"value": value, "expires_at": time.time() + CACHE_TTL_SECONDS}


def clear_cache() -> None:
    # La invalidacion global simplifica la coherencia: cualquier cambio de inventario
    # puede afectar multiples listados, filtros y ordenamientos al mismo tiempo.
    CACHE.clear()
