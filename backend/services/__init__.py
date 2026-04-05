"""Exportaciones de la capa de servicios para logica compartida del backend.

El paquete mantiene helpers reutilizables fuera de routers y scripts.
"""

from .cache import cache_get, cache_set, clear_cache
from .errors import error_response
from .inventory import compute_stock, create_audit, get_item_or_404
from .rate_limit import check_rate_limit
from .serializers import audit_to_dict, item_to_dict, movement_to_dict
from .users import seed_users
from .validation import parse_integer, parse_non_negative_float, parse_non_negative_int, validation_internal

__all__ = [
    "audit_to_dict",
    "cache_get",
    "cache_set",
    "check_rate_limit",
    "clear_cache",
    "compute_stock",
    "create_audit",
    "error_response",
    "get_item_or_404",
    "item_to_dict",
    "movement_to_dict",
    "parse_integer",
    "parse_non_negative_float",
    "parse_non_negative_int",
    "seed_users",
    "validation_internal",
]
