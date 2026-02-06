from flask import jsonify
from werkzeug.exceptions import HTTPException


def error_response(code, message, details=None):
    payload = {"error": message, "code": code}
    if details:
        payload["details"] = details
    return jsonify(payload), code


def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return error_response(error.code or 500, error.name, error.description)

    @app.errorhandler(Exception)
    def handle_exception(error):
        app.logger.exception("Unhandled error: %s", error)
        return error_response(500, "Error interno del servidor.")
