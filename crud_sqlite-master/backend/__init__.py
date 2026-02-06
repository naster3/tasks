from flask import Flask, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from .config import get_config
from .errors import error_response, register_error_handlers
from .extensions import db, migrate
from .logging_config import configure_logging
from .routes import api


def create_app(config_overrides=None):
    app = Flask(__name__)
    app.config.from_mapping(get_config())
    if config_overrides:
        app.config.update(config_overrides)

    db.init_app(app)
    migrate.init_app(app, db)

    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[app.config["RATELIMIT_DEFAULT"]],
        enabled=app.config["RATELIMIT_ENABLED"],
    )
    limiter.init_app(app)

    origins = [
        origin.strip()
        for origin in app.config.get("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]
    CORS(app, resources={r"/api/*": {"origins": origins}})

    configure_logging(app)
    register_error_handlers(app)

    @app.before_request
    def require_api_key():
        if not request.path.startswith("/api"):
            return None
        if request.path == "/api/health":
            return None
        api_key = app.config.get("API_KEY")
        if not api_key:
            return None
        provided = request.headers.get("X-API-Key") or request.args.get("api_key")
        if provided != api_key:
            return error_response(401, "No autorizado.")
        return None

    app.register_blueprint(api, url_prefix="/api")

    return app


app = create_app()
