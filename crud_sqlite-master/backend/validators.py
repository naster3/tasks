from datetime import datetime

from .models import MAX_DESC, MAX_TITLE

ALLOWED_STATUSES = {"hecho", "en proceso"}


def sanitize_task_payload(payload, partial=False):
    errors = {}
    data = {}

    if not isinstance(payload, dict):
        return data, {"payload": "JSON invalido."}

    if not partial or "title" in payload:
        title = (payload.get("title") or "").strip()
        if not title:
            errors["title"] = "Titulo requerido."
        elif len(title) > MAX_TITLE:
            errors["title"] = f"Titulo debe tener maximo {MAX_TITLE} caracteres."
        else:
            data["title"] = title

    if not partial or "description" in payload:
        description = (payload.get("description") or "").strip()
        if not description:
            errors["description"] = "Descripcion requerida."
        elif len(description) > MAX_DESC:
            errors["description"] = f"Descripcion debe tener maximo {MAX_DESC} caracteres."
        else:
            data["description"] = description

    if not partial or "status" in payload:
        status = (payload.get("status") or "en proceso").strip().lower()
        if status not in ALLOWED_STATUSES:
            errors["status"] = "Estado invalido."
        else:
            data["status"] = status

    return data, errors


def parse_date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None
