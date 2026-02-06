# DevNaster Tasks

Aplicacion de tareas en React + Vite con estructura por features.

## Scripts
```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run preview
```

## Desarrollo
1. Inicia el backend en `crud_sqlite-master`.
2. Inicia el frontend con `pnpm run dev`.

## Backend (SQLite)
El backend vive en `crud_sqlite-master` y expone la API usada por el frontend.

```powershell
cd crud_sqlite-master
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Opcional: define `VITE_API_URL` si no usas el proxy de Vite.

## Estructura
```
src/
  app/              # layout y router
  pages/            # pantallas
  features/         # logica por dominio (tareas)
  shared/           # componentes y estilos globales
```

## Rutas
- `/` Lista de tareas
- `/guide` Guia de usuario

## Desktop (Tauri)
Tauri usa el mismo frontend y puede ejecutar el backend Flask como sidecar.

1. (Opcional) genera el sidecar desde `crud_sqlite-master/scripts`.
2. Instala dependencias y ejecuta:
```bash
pnpm install
pnpm run tauri:dev
```

Para build:
```bash
pnpm run tauri:build
```

Si no usas sidecar, debes iniciar el backend manualmente.
Para evitar iniciar el sidecar en dev: `set TAURI_DISABLE_SIDECAR=1`.
