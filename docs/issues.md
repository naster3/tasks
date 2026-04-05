# Registro de Errores e Incidencias

Este archivo se usa para registrar errores, deuda tecnica e incidencias funcionales del proyecto.

## Estados

- `open`: pendiente
- `in_progress`: en curso
- `resolved`: corregido
- `wont_fix`: no se corregira

## Prioridades

- `critical`
- `high`
- `medium`
- `low`

## Plantilla

```md
## ISSUE-XXX
- Estado: open
- Prioridad: medium
- Area: frontend | backend | api | ux | infra | docs
- Fecha: YYYY-MM-DD
- Resumen: descripcion corta
- Impacto: que rompe o degrada
- Reproduccion: pasos breves
- Causa probable: hipotesis tecnica
- Accion recomendada: siguiente paso claro
```

## Incidencias actuales

## ISSUE-001
- Estado: open
- Prioridad: high
- Area: testing
- Fecha: 2026-04-05
- Resumen: el proyecto no tiene pruebas automatizadas propias
- Impacto: las regresiones funcionales dependen de validacion manual, lint y compilacion
- Reproduccion: revisar el repo; no hay suites de test para frontend ni backend
- Causa probable: el proyecto evoluciono desde un MVP y la cobertura nunca se formalizo
- Accion recomendada: agregar pruebas API para auth, items, movimientos y auditoria; luego pruebas UI para filtros y modales

## ISSUE-002
- Estado: open
- Prioridad: medium
- Area: frontend
- Fecha: 2026-04-05
- Resumen: existe codigo residual en `src/App.jsx` que ya no participa en el arranque real
- Impacto: aumenta ruido arquitectonico y puede confundir sobre el punto de entrada
- Reproduccion: `src/main.jsx` renderiza `RouterProvider`, mientras `src/App.jsx` esta vacio y sin uso real
- Causa probable: remanente del template inicial de Vite
- Accion recomendada: eliminar `src/App.jsx` y `src/App.css` si ya no forman parte del proyecto

## ISSUE-003
- Estado: open
- Prioridad: medium
- Area: backend
- Fecha: 2026-04-05
- Resumen: el backend usa modelos SQLAlchemy clasicos y depende de casts manuales para satisfacer a Pylance
- Impacto: el tipado estatico es mas fragil y cada cambio en modelos puede volver a disparar warnings
- Reproduccion: revisar `backend/app.py`, `backend/security.py` y `backend/services.py`
- Causa probable: modelos definidos con `Column(...)` clasico en vez de `Mapped[...]` y `mapped_column(...)`
- Accion recomendada: migrar a SQLAlchemy tipado moderno para reducir casts y mejorar mantenibilidad

## ISSUE-004
- Estado: open
- Prioridad: medium
- Area: seguridad
- Fecha: 2026-04-05
- Resumen: la autenticacion del frontend sigue basada en bearer token del lado cliente
- Impacto: aunque ahora se guarda en `sessionStorage`, sigue siendo menos robusto que una sesion con cookie `HttpOnly`
- Reproduccion: revisar `src/components/inventory/useInventorySession.js`
- Causa probable: se eligio una estrategia simple de auth para desarrollo y MVP
- Accion recomendada: evaluar migracion a cookie `HttpOnly`, `Secure` y `SameSite` para produccion

## ISSUE-005
- Estado: open
- Prioridad: low
- Area: observabilidad
- Fecha: 2026-04-05
- Resumen: no existe logging estructurado ni registro persistente de errores runtime
- Impacto: dificulta investigar fallos en produccion o correlacionar errores por request
- Reproduccion: revisar backend; solo hay respuestas HTTP y utilidades en memoria
- Causa probable: la observabilidad no se implemento aun
- Accion recomendada: agregar logger estructurado y registrar errores con contexto basico por request

## ISSUE-006
- Estado: resolved
- Prioridad: medium
- Area: observabilidad
- Fecha: 2026-04-05
- Resumen: se agrego logging estructurado JSON y `X-Request-ID` por request
- Impacto: mejora trazabilidad de errores y correlacion entre cliente y backend
- Reproduccion: levantar backend y revisar consola o `logs/app.log`
- Causa probable: no aplica
- Accion recomendada: siguiente paso opcional, integrar agregacion externa o monitoreo
