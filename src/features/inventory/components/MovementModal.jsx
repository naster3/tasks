import { useId, useState } from 'react'

// Este modal registra entradas, salidas, ajustes y devoluciones.
// La validacion previa protege al usuario de enviar cantidades que no tienen
// sentido para el tipo de movimiento elegido.
export default function MovementModal({ item, onSave, onClose }) {
  const headingId = useId()
  const [type, setType] = useState('entrada')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    const parsedQty = qty === '' ? null : Number(qty)
    if (parsedQty === null || Number.isNaN(parsedQty)) {
      alert('La cantidad debe ser numerica.')
      return
    }

    if (type !== 'ajuste' && parsedQty <= 0) {
      alert('La cantidad debe ser mayor a cero.')
      return
    }

    if (type === 'ajuste' && parsedQty === 0) {
      alert('El ajuste no puede ser cero.')
      return
    }

    onSave({
      type,
      qty: parsedQty,
      note: note.trim(),
    })
  }

  return (
    <div className="inventory-modal__overlay">
      <div className="inventory-modal__card" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <button type="button" className="inventory-dialog__close" aria-label="Cerrar modal de movimiento" onClick={onClose}>
          X
        </button>
        <h3 id={headingId}>Registrar movimiento</h3>
        <p className="inventory-modal__subtitle">
          {item.name} - {item.sku}
        </p>

        <div className="inventory-modal__grid">
          <label>
            Tipo
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="ajuste">Ajuste</option>
              <option value="devolucion">Devolucion</option>
            </select>
          </label>
          <label>
            Cantidad
            <input
              type="number"
              step="1"
              value={qty}
              onChange={(event) => setQty(event.target.value)}
            />
          </label>
          <label className="inventory-modal__field--full">
            Nota
            <input type="text" value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
        </div>

        <div className="inventory-form__actions">
          <button type="button" className="inventory-button inventory-button--primary" onClick={handleSubmit}>
            Guardar movimiento
          </button>
          <button type="button" className="inventory-button inventory-button--ghost" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
