from datetime import datetime, time
from math import ceil

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import or_

from .cache import build_cache_key, cache_clear, cache_get, cache_set
from .errors import error_response
from .extensions import db
from .models import Task
from .utils import build_links
from .validators import ALLOWED_STATUSES, parse_date, sanitize_task_payload

api = Blueprint("api", __name__)


@api.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@api.route("/tasks", methods=["GET"])
def list_tasks():
    query = (request.args.get("query") or "").strip()
    status = (request.args.get("status") or "").strip().lower()
    sort = (request.args.get("sort") or "created_at").strip()
    order = (request.args.get("order") or "desc").strip().lower()
    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=20, type=int)
    date_from = (request.args.get("date_from") or "").strip()
    date_to = (request.args.get("date_to") or "").strip()

    page = max(page, 1)
    limit = min(max(limit, 1), 100)

    cache_key = build_cache_key(
        request.host_url,
        query=query,
        status=status,
        sort=sort,
        order=order,
        page=page,
        limit=limit,
        date_from=date_from,
        date_to=date_to,
    )
    cached = cache_get(cache_key)
    if cached:
        return jsonify(cached)

    tasks_query = Task.query

    if query:
        like = f"%{query}%"
        tasks_query = tasks_query.filter(
            or_(Task.title.ilike(like), Task.description.ilike(like))
        )

    if status:
        if status not in ALLOWED_STATUSES:
            return error_response(400, "Estado invalido.", {"status": status})
        tasks_query = tasks_query.filter(Task.status == status)

    if date_from:
        parsed_from = parse_date(date_from)
        if not parsed_from:
            return error_response(400, "date_from invalido.")
        start_dt = datetime.combine(parsed_from, time.min)
        tasks_query = tasks_query.filter(Task.created_at >= start_dt)

    if date_to:
        parsed_to = parse_date(date_to)
        if not parsed_to:
            return error_response(400, "date_to invalido.")
        end_dt = datetime.combine(parsed_to, time.max)
        tasks_query = tasks_query.filter(Task.created_at <= end_dt)

    sort_map = {
        "created_at": Task.created_at,
        "title": Task.title,
        "status": Task.status,
    }
    sort_col = sort_map.get(sort)
    if not sort_col:
        return error_response(400, "Campo sort invalido.")

    if order == "asc":
        tasks_query = tasks_query.order_by(sort_col.asc())
    else:
        tasks_query = tasks_query.order_by(sort_col.desc())

    total = tasks_query.count()
    total_pages = max(1, ceil(total / limit)) if total is not None else 1
    page = min(page, total_pages)
    offset = (page - 1) * limit
    tasks = tasks_query.offset(offset).limit(limit).all()

    links = build_links(
        page=page,
        total_pages=total_pages,
        limit=limit,
        query=query,
        status=status,
        sort=sort,
        order=order,
        date_from=date_from,
        date_to=date_to,
    )

    payload = {
        "items": [task.to_dict() for task in tasks],
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "links": links,
    }
    cache_set(cache_key, payload, current_app.config["CACHE_TTL_SECONDS"])
    return jsonify(payload)


@api.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify(task.to_dict())


@api.route("/tasks", methods=["POST"])
def create_task():
    payload = request.get_json(silent=True) or {}
    data, errors = sanitize_task_payload(payload)
    if errors:
        return error_response(400, "Error de validacion.", errors)

    task = Task()
    task.title = data["title"]
    task.description = data["description"]
    task.status = data["status"]
    db.session.add(task)
    db.session.commit()
    cache_clear()
    return jsonify(task.to_dict()), 201


@api.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    payload = request.get_json(silent=True) or {}
    data, errors = sanitize_task_payload(payload, partial=True)
    if errors:
        return error_response(400, "Error de validacion.", errors)
    if not data:
        return error_response(400, "No hay campos para actualizar.")

    for key, value in data.items():
        setattr(task, key, value)
    db.session.commit()
    cache_clear()
    return jsonify(task.to_dict())


@api.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    cache_clear()
    return "", 204
