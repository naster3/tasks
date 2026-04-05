# Inventory App

Aplicacion full stack para gestionar inventario de ropa y accesorios con frontend modular en React y backend modular en FastAPI.

## Stack

- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy
- Base de datos: SQLite por defecto, con soporte para PostgreSQL via `DATABASE_URL`
- Desktop: Tauri disponible en `src-tauri/`

## Funcionalidades

- autenticacion por token con roles `admin`, `operador` y `solo_lectura`
- alta y edicion de productos
- movimientos de inventario: `entrada`, `salida`, `ajuste`, `devolucion`
- bitacora de movimientos y auditoria por producto
- archivado y restauracion de productos
- importacion y exportacion CSV
- migracion de datos locales desde `localStorage`

## Estructura

```txt
my-project/
  backend/
    __init__.py
    __main__.py
    api/
    core/
    db/
    scripts/
    services/
  src/
    app/
    pages/
    features/
```

## Requisitos

- Node.js 18+
- Python 3.11+

## Ejecutar frontend

```bash
pnpm install
pnpm run dev
```

Frontend por defecto: `http://localhost:5173`

## Ejecutar backend

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
python -m backend
```

Alternativa con Uvicorn:

```powershell
uvicorn backend.api.app:app --reload --port 5001
```

Backend por defecto: `http://localhost:5001`

Documentacion interactiva:

- Swagger UI: `http://localhost:5001/docs`
- ReDoc: `http://localhost:5001/redoc`

## Variables de entorno backend

- `DATABASE_URL`: cadena SQLAlchemy
- `APP_ENV`: `development` o `production`
- `ADMIN_PASSWORD`: clave inicial de `admin`
- `OPERATOR_PASSWORD`: clave inicial de `operador`
- `READONLY_PASSWORD`: clave inicial de `lector`
- `API_RATE_LIMIT`: requests por minuto
- `CACHE_TTL_SECONDS`: TTL del cache en memoria para `GET /items`
- `CORS_ORIGINS`: lista separada por comas de origenes permitidos
- `ALLOW_ALL_CORS`: `true` solo para entornos de desarrollo puntuales
- `LOG_LEVEL`: nivel de logs del backend
- `LOG_TO_FILE`: habilita escritura de logs en archivo
- `LOG_FILE_PATH`: ruta del archivo de logs del backend

## Integracion frontend/backend

El frontend usa `VITE_API_BASE` para apuntar al backend. Si no se define, usa:

```txt
http://localhost:5001
```

La sesion del frontend se guarda en `sessionStorage`, no en `localStorage`, por lo que se limpia al cerrar la pestana.

## Calidad

Comandos utiles:

```bash
pnpm run lint
pnpm run build
python -m compileall backend
```

Registro de incidencias:

- `docs/issues.md`
- `docs/error-registry.json`

## Desktop

Si usas Tauri:

```bash
pnpm run tauri:dev
pnpm run tauri:build
```

## Estado actual

- `lint` del frontend en verde
- `build` del frontend en verde
- backend modularizado por capas (`api`, `core`, `db`, `services`, `scripts`)
- frontend modularizado por `app`, `pages` y `features`
- comentarios detallados en espanol en backend y frontend clave
- accesibilidad visual reforzada en tabla, filtros y formularios
