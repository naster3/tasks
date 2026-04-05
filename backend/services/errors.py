"""Helpers para construir errores FastAPI con formato consistente."""

from typing import Any, Dict, Optional

from fastapi import HTTPException


def error_response(
    status_code: int,
    message: str,
    extra: Optional[Dict[str, Any]] = None,
    internal: Optional[Dict[str, Any]] = None,
) -> HTTPException:
    # El metadato interno va en _meta para que los handlers registren mas contexto.
    detail: Dict[str, Any] = {"error": message}
    if extra:
        detail.update(extra)
    if internal:
        detail["_meta"] = internal
    return HTTPException(status_code=status_code, detail=detail)
