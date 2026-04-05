# API Inventario (FastAPI)

> Comentario de mantenimiento: esta documentacion describe la estructura modular actual de `backend/`.

## Setup rapido

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
```

## Ejecutar

```bash
cd ..
python -m backend
```

O con Uvicorn:

```bash
uvicorn backend.api.app:app --reload --port 5001
```

## Configuracion

- `DATABASE_URL`: cadena SQLAlchemy (por defecto SQLite `sqlite:///inventory.db`)
- `APP_ENV`: `development` o `production`
- `ADMIN_PASSWORD`: password del usuario admin inicial
- `OPERATOR_PASSWORD`: password del usuario operador inicial
- `READONLY_PASSWORD`: password del usuario solo lectura inicial
- `API_RATE_LIMIT`: requests por minuto (default `120`)
- `CACHE_TTL_SECONDS`: TTL cache GET /items (default `30`)
- `CORS_ORIGINS`: origenes permitidos separados por comas
- `ALLOW_ALL_CORS`: `true` para permitir `*` en desarrollo puntual
- `LOG_LEVEL`: nivel de logs (`INFO`, `WARNING`, `ERROR`, etc.)
- `LOG_TO_FILE`: `true` para guardar logs tambien en archivo
- `LOG_FILE_PATH`: ruta del archivo de log (default `logs/app.log`)

Notas:

- En `development`, si no defines passwords, se usan `admin123`, `operator123` y `readonly123`.
- En `production`, los tres passwords son obligatorios.

## Estructura

- `backend/api/`: factory de FastAPI, lifecycle, middleware, handlers y routers por dominio.
- `backend/core/`: configuracion, logging y seguridad compartida.
- `backend/db/`: sesion SQLAlchemy y modelos.
- `backend/services/`: cache, rate limit, validaciones, serializacion y servicios de inventario.
- `backend/scripts/`: scripts de seed, limpieza, fixtures y utilidades de datos de prueba.
- `backend/__main__.py`: punto de entrada limpio para `python -m backend`.

## Documentacion interactiva

- Swagger UI: `http://localhost:5001/docs`
- ReDoc: `http://localhost:5001/redoc`

## Auth

Login:

```http
POST /auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

Respuesta:

```json
{ "token": "...", "role": "admin" }
```

Usa `Authorization: Bearer <token>` en los siguientes requests.

## Endpoints

- `GET /items` (filtros: `q`, `category`, `status`, `location`, `sort`, `archived`)
- `POST /items`
- `PUT /items/<id>`
- `DELETE /items/<id>` (soft delete)
- `POST /items/<id>/restore` (restore)
- `POST /movements`
- `GET /items/<id>/movements`
- `GET /items/<id>/audit`
- `GET /health`

## Notas

- El stock se calcula por movimientos (`entrada`, `salida`, `ajuste`, `devolucion`).
- La auditoria registra actor, fecha y cambios antes/despues.
- Rate limit y cache son en memoria (no compartidos entre procesos).
- `archived=false` devuelve solo activos; `archived=true` devuelve solo archivados.
- El backend genera logs JSON por consola y, por defecto, tambien en `logs/app.log`.
- Cada request incluye `X-Request-ID` en la respuesta para correlacion con logs.
- `backend/` ahora es un paquete Python explicito; los scripts auxiliares deben ejecutarse como modulo, por ejemplo `python -m backend.scripts.seed_test_users`.
