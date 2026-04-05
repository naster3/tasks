// Este resumen expone dos metricas pequenas pero criticas:
// unidades disponibles y productos que ya requieren atencion.
export default function InventorySummary({ lowStock, totalStock }) {
  return (
    <div className="inventory-summary" aria-label="Resumen general del inventario">
      <div className="inventory-summary__card">
        <span className="inventory-summary__label">Unidades totales</span>
        <strong>{totalStock}</strong>
      </div>
      <div className="inventory-summary__card inventory-summary__card--warning">
        <span className="inventory-summary__label">Bajo stock</span>
        <strong>{lowStock}</strong>
      </div>
    </div>
  )
}
