"""Middleware HTTP para trazabilidad de requests y latencia."""

import uuid
from time import perf_counter

from fastapi import FastAPI, Request

from .common import logger, request_context


def register_middleware(app: FastAPI) -> None:
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        # Cada request recibe un identificador de correlacion para unir logs y respuestas.
        request.state.request_id = uuid.uuid4().hex
        started_at = perf_counter()

        logger.info(
            "Request started",
            extra={"context": request_context(request)},
        )

        response = await call_next(request)

        # La duracion se registra despues de producir la respuesta para medir el tiempo completo.
        duration_ms = round((perf_counter() - started_at) * 1000, 2)
        response.headers["X-Request-ID"] = request.state.request_id
        logger.info(
            "Request completed",
            extra={"context": request_context(request, status_code=response.status_code, duration_ms=duration_ms)},
        )
        return response
