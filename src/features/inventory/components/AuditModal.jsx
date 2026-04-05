import { useId } from 'react'

const movementLabels = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
  devolucion: 'Devolucion',
}

// Este modal combina dos fuentes de trazabilidad: movimientos operativos y
// eventos de auditoria. Ver ambas capas juntas ayuda a entender que cambio,
// quien lo hizo y cuando ocurrio.
export default function AuditModal({ item, onClose }) {
  const headingId = useId()
  const movements = item.movements || []
  const audit = item.audit || []

  const describeChanges = (entry) => {
    // Cuando existen valores "before" y "after", se arma un resumen legible
    // para no obligar al usuario a comparar objetos manualmente.
    if (!entry.before || !entry.after) return entry.note || ''

    const keys = Array.from(new Set([...Object.keys(entry.before), ...Object.keys(entry.after)]))
    const changes = keys.filter((key) => entry.before[key] !== entry.after[key])

    if (!changes.length) return entry.note || ''
    return changes.map((key) => `${key}: "${entry.before[key]}" -> "${entry.after[key]}"`).join(' | ')
  }

  return (
    <div className="inventory-modal__overlay">
      <div className="inventory-modal__card" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <button type="button" className="inventory-dialog__close" aria-label="Cerrar bitacora y auditoria" onClick={onClose}>
          X
        </button>
        <h3 id={headingId}>Bitacora y movimientos</h3>
        <p className="inventory-modal__subtitle">
          {item.name} - {item.sku}
        </p>

        <div className="inventory-modal__section">
          <h4>Movimientos</h4>
          {movements.length === 0 ? (
            <p className="inventory-modal__muted">Sin movimientos registrados.</p>
          ) : (
            <div className="inventory-modal__list">
              {movements.map((movement) => (
                <div key={movement.id} className="inventory-modal__item">
                  <strong>{movementLabels[movement.type] || movement.type}</strong>
                  <span className="inventory-table__mono">Qty: {movement.qty}</span>
                  <span className="inventory-modal__muted">{movement.note || 'Sin nota'}</span>
                  <span className="inventory-modal__muted">
                    {movement.createdBy} - {new Date(movement.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="inventory-modal__section">
          <h4>Auditoria</h4>
          {audit.length === 0 ? (
            <p className="inventory-modal__muted">Sin eventos de auditoria.</p>
          ) : (
            <div className="inventory-modal__list">
              {audit.map((entry) => (
                <div key={entry.id} className="inventory-modal__item">
                  <strong>{entry.action}</strong>
                  <span className="inventory-modal__muted">
                    {entry.actor} - {new Date(entry.createdAt).toLocaleString()}
                  </span>
                  <span className="inventory-modal__muted">{describeChanges(entry)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
