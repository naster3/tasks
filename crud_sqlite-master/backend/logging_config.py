import json
import logging
import time
import uuid

from flask import g, request


def configure_logging(app):
    handler = logging.StreamHandler()
    formatter = logging.Formatter("%(message)s")
    handler.setFormatter(formatter)
    app.logger.handlers.clear()
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)

    @app.before_request
    def start_timer():
        g.start_time = time.time()
        g.request_id = uuid.uuid4().hex

    @app.after_request
    def log_request(response):
        duration = time.time() - g.start_time
        payload = {
            "request_id": g.request_id,
            "method": request.method,
            "path": request.path,
            "status": response.status_code,
            "duration_ms": int(duration * 1000),
        }
        app.logger.info(json.dumps(payload))
        response.headers["X-Request-Id"] = g.request_id
        return response
