"""Endpoint minimo de salud para chequeos locales y despliegues."""

from fastapi import APIRouter, Request

from ...services.rate_limit import check_rate_limit

router = APIRouter(tags=["system"])


@router.get("/health")
def health(request: Request):
    # Health tambien respeta rate limit para no convertirse en una via de escape.
    check_rate_limit(request)
    return {"status": "ok"}
