"""Inicia el paquete backend con ``python -m backend``."""

import uvicorn


if __name__ == "__main__":
    # Mantiene un punto de entrada unico para que la ejecucion local y la documentacion coincidan.
    uvicorn.run("backend.api.app:app", host="0.0.0.0", port=5001, reload=False)
