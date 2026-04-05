"""Helpers de parseo de entrada para endpoints que aun aceptan diccionarios crudos.

Estas funciones existen porque parte de la API todavia usa payloads manuales en
lugar de esquemas tipados de Pydantic para cada body. Centralizar el parseo aqui
evita repetir mensajes y metadatos de error en cada ruta.
"""

from typing import Any, Dict

from .errors import error_response


def validation_internal(field_name: str) -> Dict[str, Any]:
    # Genera un bloque de metadata interna uniforme para que el handler de errores
    # pueda registrar fallos de validacion con un formato consistente.
    return {
        "event": "request.validation.failed",
        "error_kind": "validation",
        "field": field_name,
    }


def parse_non_negative_float(value: Any, field_name: str) -> float:
    # Convierte el valor a float lo antes posible para que el resto de la logica
    # opere ya sobre un tipo numerico valido y no sobre strings u objetos mixtos.
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        raise error_response(400, f"Invalid {field_name}", internal=validation_internal(field_name)) from None

    if parsed < 0:
        # Para este dominio, campos como price no admiten negativos.
        raise error_response(400, f"Invalid {field_name}", internal=validation_internal(field_name))

    return parsed


def parse_integer(value: Any, field_name: str) -> int:
    # La conversion entera se comparte entre IDs, cantidades y otros campos discretos.
    # Tener una sola implementacion evita divergencias en mensajes y excepciones.
    try:
        return int(value)
    except (TypeError, ValueError):
        raise error_response(400, f"Invalid {field_name}", internal=validation_internal(field_name)) from None


def parse_non_negative_int(value: Any, field_name: str) -> int:
    # Esta variante reutiliza parse_integer y luego aplica la regla de no negatividad.
    parsed = parse_integer(value, field_name)
    if parsed < 0:
        raise error_response(400, f"Invalid {field_name}", internal=validation_internal(field_name))
    return parsed
