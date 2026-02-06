# Backend SQLite

API Flask para persistencia de tareas (usada por el frontend React).

## Instalacion
```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Ejecutar
```powershell
python app.py
```

El backend queda en `http://127.0.0.1:5000`.

## Endpoints
- `GET /api/tasks`
- `GET /api/tasks/<id>`
- `POST /api/tasks`
- `PUT /api/tasks/<id>`
- `DELETE /api/tasks/<id>`

## Paginacion y filtros
`GET /api/tasks?page=1&limit=20&query=texto&status=hecho&sort=created_at&order=desc`

Respuesta:
```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "total_pages": 1,
  "links": {
    "first": "...",
    "last": "...",
    "next": null,
    "prev": null
  }
}
```

## Configuracion (.env)
- `DATABASE_URL` (ej. `sqlite:///task.db`)
- `SECRET_KEY`
- `DEBUG` (`true`/`false`)
- `API_HOST` (ej. `127.0.0.1`)
- `API_PORT` (ej. `5000`)
- `CORS_ORIGINS` (ej. `http://localhost:5173`)
- `API_KEY` (si se define, se exige header `X-API-Key`)
- `RATELIMIT_DEFAULT` (ej. `200 per hour`)
- `RATELIMIT_STORAGE_URI` (ej. `memory://`)
- `RATELIMIT_ENABLED` (`true`/`false`)
- `CACHE_TTL_SECONDS` (ej. `5`)

## Migraciones
```powershell
flask --app backend db init
flask --app backend db migrate -m "init"
flask --app backend db upgrade
```

## Sidecar (Tauri)
Para empaquetar el backend como ejecutable:

Windows:
```powershell
.\scripts\build_sidecar.ps1
```

macOS/Linux:
```bash
./scripts/build_sidecar.sh
```

El binario se copia a `src-tauri/binaries` para que Tauri lo incluya.

## Tests
```powershell
pytest
```

## Nota de base de datos
Si cambias el modelo, borra `task.db` para recrear la tabla.
