import { formatPrice, statusClass } from '../utils/index.js'

// La tabla queda aislada en su propio componente para que la pagina principal
// no cargue con detalles de celdas, filas, paginacion y acciones por producto.
export default function InventoryTableGrid({
  actions,
  disabled,
  isLoading,
  pageItems,
  pagination,
  permissions,
  selection,
}) {
  const { handleArchive, handleEdit, handleMovement, handleOpenAudit, handleRestore } = actions
  const { currentPageSafe, pageSize, setCurrentPage, setPageSize, totalPages } = pagination
  const { canArchive, canEdit, token } = permissions
  const { isAllPageSelected, selectedIds, toggleSelect, toggleSelectAll } = selection

  return (
    <>
      <div className={`inventory-table ${disabled ? 'inventory-table--disabled' : ''}`}>
        <table>
          <caption className="sr-only">Listado de productos del inventario</caption>
          <thead>
            <tr>
              <th scope="col">
                <input
                  type="checkbox"
                  aria-label="Seleccionar o deseleccionar todos los productos de la pagina actual"
                  checked={isAllPageSelected}
                  onChange={(event) => toggleSelectAll(event.target.checked)}
                />
              </th>
              <th scope="col">SKU</th>
              <th scope="col">Producto</th>
              <th scope="col">Categoria</th>
              <th scope="col">Talla</th>
              <th scope="col">Color</th>
              <th scope="col">Stock</th>
              <th scope="col">Precio</th>
              <th scope="col">Estado</th>
              <th scope="col">Ubicacion</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!token ? (
              <tr>
                <td className="inventory-table__empty" colSpan="11">
                  Inicia sesion para ver el inventario.
                </td>
              </tr>
            ) : pageItems.length === 0 ? (
              <tr>
                <td className="inventory-table__empty" colSpan="11">
                  No hay coincidencias con el filtro.
                </td>
              </tr>
            ) : (
              pageItems.map((item) => (
                <tr key={item.id} className={item.archivedAt ? 'inventory-table__row--archived' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${item.name}`}
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="inventory-table__mono">{item.sku}</td>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.size}</td>
                  <td>{item.color}</td>
                  <td className="inventory-table__mono">{item.stock}</td>
                  <td className="inventory-table__mono">{formatPrice(item.price)}</td>
                  <td>
                    <span className={statusClass(item.status)}>{item.status}</span>
                  </td>
                  <td>{item.location}</td>
                  <td className="inventory-table__actions">
                    <button type="button" className="inventory-button inventory-button--ghost" aria-label={`Ver bitacora de ${item.name}`} onClick={() => handleOpenAudit(item)} disabled={!token || isLoading}>
                      Bitacora
                    </button>
                    {!item.archivedAt && (
                      <>
                        {/* El orden de acciones sigue el flujo operativo mas comun:
                            revisar, mover, editar y por ultimo archivar. */}
                        <button type="button" className="inventory-button inventory-button--ghost" aria-label={`Registrar movimiento para ${item.name}`} onClick={() => handleMovement(item)} disabled={!canEdit}>
                          Movimiento
                        </button>
                        <button type="button" className="inventory-button inventory-button--ghost" aria-label={`Editar ${item.name}`} onClick={() => handleEdit(item)} disabled={!canEdit}>
                          Editar
                        </button>
                        <button type="button" className="inventory-button inventory-button--danger" aria-label={`Archivar ${item.name}`} onClick={() => handleArchive(item)} disabled={!canArchive}>
                          Archivar
                        </button>
                      </>
                    )}
                    {item.archivedAt && (
                      <button type="button" className="inventory-button inventory-button--ghost" aria-label={`Restaurar ${item.name}`} onClick={() => handleRestore(item)} disabled={!canArchive}>
                        Restaurar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="inventory-pagination">
        <div className="inventory-pagination__size">
          <label>
            Filas por pagina
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} disabled={!token}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>

        <div className="inventory-pagination__controls" aria-label="Controles de paginacion">
          <button type="button" className="inventory-button inventory-button--ghost" onClick={() => setCurrentPage(1)} disabled={!token || currentPageSafe === 1}>
            Primero
          </button>
          <button
            type="button"
            className="inventory-button inventory-button--ghost"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={!token || currentPageSafe === 1}
          >
            Anterior
          </button>
          <span>
            Pagina {currentPageSafe} de {totalPages}
          </span>
          <button
            type="button"
            className="inventory-button inventory-button--ghost"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={!token || currentPageSafe === totalPages}
          >
            Siguiente
          </button>
          <button type="button" className="inventory-button inventory-button--ghost" onClick={() => setCurrentPage(totalPages)} disabled={!token || currentPageSafe === totalPages}>
            Ultimo
          </button>
        </div>
      </div>
    </>
  )
}
