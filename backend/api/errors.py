"""Traduccion centralizada de excepciones HTTP y errores de validacion.

Este modulo define como se transforman excepciones internas en respuestas HTTP
consistentes, y como se registran en logs con suficiente contexto tecnico y de
seguridad sin filtrar metadatos internos al cliente.
"""

from typing import Any, Dict, Optional, cast

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .common import logger, request_context


def default_http_event(status_code: int) -> str:
    # Usa nombres de evento generales cuando no existe una clasificacion mas precisa.
    # Sirve como red de seguridad para que todo rechazo tenga al menos un evento estable.
    return {
        400: "request.invalid",
        401: "auth.unauthorized",
        403: "auth.forbidden",
        404: "resource.not_found",
        409: "request.conflict",
        422: "request.validation.failed",
        429: "rate_limit.exceeded",
    }.get(status_code, "request.rejected")


def infer_security_event(status_code: int, public_detail: Dict[str, Any]) -> Optional[str]:
    # Intenta traducir errores visibles al cliente a eventos concretos de seguridad.
    # Eso permite que 401/403/429 no se queden como errores genericos en los logs.
    detail = str(public_detail.get("error") or "").strip().lower()

    if status_code == 401:
        if detail == "missing token":
            return "auth.token.missing"
        if detail == "invalid token":
            return "auth.token.invalid"
        if detail == "expired token":
            return "auth.token.expired"
        return "auth.unauthorized"

    if status_code == 403 and detail == "forbidden":
        return "auth.forbidden"

    if status_code == 429:
        return "rate_limit.exceeded"

    return None


def infer_http_event(status_code: int, public_detail: Dict[str, Any]) -> str:
    # Prioriza el evento de seguridad cuando existe; si no, usa el mapa HTTP general.
    security_event = infer_security_event(status_code, public_detail)
    if security_event is not None:
        return security_event
    return default_http_event(status_code)


def split_error_detail(detail: Any) -> tuple[Dict[str, Any], Dict[str, Any]]:
    # Separa la parte publica del error de la metadata interna.
    # La parte publica vuelve al cliente; la metadata alimenta logs y clasificacion.
    if not isinstance(detail, dict):
        return {"error": str(detail)}, {}

    public_detail = dict(detail)
    meta = public_detail.pop("_meta", {})
    if not isinstance(meta, dict):
        meta = {}
    return public_detail, meta


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        # HTTPException es la salida esperada para validaciones, conflictos y reglas de negocio.
        # Aqui se reconstruye la respuesta final y se registran eventos uniformes en logs.
        public_detail, meta = split_error_detail(exc.detail)
        log_context = {
            key: value
            for key, value in meta.items()
            if key not in {"event", "error_kind"} and value is not None
        }
        security_event = infer_security_event(exc.status_code, public_detail)
        event = cast(str, security_event or meta.get("event") or infer_http_event(exc.status_code, public_detail))
        error_kind = cast(
            Optional[str],
            meta.get("error_kind")
            or ("security" if security_event is not None else None)
            or ("validation" if exc.status_code in {400, 422} else None),
        )
        if security_event is not None:
            # Los eventos de seguridad reciben un log especifico adicional para que puedan
            # filtrarse aparte de los errores HTTP generales.
            logger.warning(
                "Security rejection",
                extra={
                    "context": request_context(
                        request,
                        status_code=exc.status_code,
                        event=security_event,
                        error_kind=error_kind or "security",
                        detail=public_detail.get("error"),
                        **log_context,
                    )
                },
            )
        # Ademas del posible log de seguridad, siempre se escribe un log HTTP uniforme.
        logger.warning(
            "HTTP exception",
            extra={
                "context": request_context(
                    request,
                    status_code=exc.status_code,
                    event=event,
                    error_kind=error_kind,
                    detail=public_detail.get("error"),
                    **log_context,
                )
            },
        )
        headers = {}
        request_id = getattr(request.state, "request_id", None)
        if request_id:
            # El request id se devuelve al cliente para correlacionar errores con logs.
            headers["X-Request-ID"] = request_id
        return JSONResponse(status_code=exc.status_code, content=public_detail, headers=headers)

    @app.exception_handler(RequestValidationError)
    async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
        # FastAPI genera este error antes de entrar a la logica del endpoint cuando falla
        # la validacion declarativa de parametros, body o query string.
        # Aqui lo normalizamos para que el frontend vea una estructura consistente.
        validation_errors = exc.errors()
        logger.warning(
            "Request validation failed",
            extra={
                "context": request_context(
                    request,
                    status_code=422,
                    event="request.validation.failed",
                    error_kind="validation",
                    validation_errors=validation_errors,
                )
            },
        )
        headers = {}
        request_id = getattr(request.state, "request_id", None)
        if request_id:
            headers["X-Request-ID"] = request_id
        return JSONResponse(
            status_code=422,
            content={"error": "Validation failed", "details": validation_errors},
            headers=headers,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Toda excepcion no esperada llega aqui como ultimo fallback.
        # Se registra con stack trace completo, pero la respuesta al cliente se mantiene
        # opaca para no exponer detalles internos del servidor.
        logger.exception(
            "Unhandled exception",
            extra={"context": request_context(request, status_code=500)},
        )
        headers = {}
        request_id = getattr(request.state, "request_id", None)
        if request_id:
            headers["X-Request-ID"] = request_id
        return JSONResponse(status_code=500, content={"error": "Internal server error"}, headers=headers)
