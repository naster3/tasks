// El panel de filtros mantiene juntas las acciones de busqueda, exportacion e
// importacion, ademas del bloque de cambios masivos. Asi la parte superior de
// la pantalla concentra todo lo que afecta la vista actual.
export default function InventoryFilters({
  actions,
  controls,
  disabled,
  fileInputRef,
  hasItems,
  permissions,
}) {
  const { canEdit, token } = permissions
  const {
    bulkCategory,
    bulkLocation,
    categoryFilter,
    categoryOptions,
    locationFilter,
    locationOptions,
    searchTerm,
    selectedCount,
    setBulkCategory,
    setBulkLocation,
    setCategoryFilter,
    setLocationFilter,
    setSearchTerm,
    setSortDirection,
    setSortField,
    setStatusFilter,
    setViewFilter,
    sortDirection,
    sortField,
    statusFilter,
    viewFilter,
  } = controls
  const { handleAdd, handleBulkUpdate, handleExport, handleImport } = actions

  return (
    <>
      <div className="inventory-toolbar">
        <button type="button" className="inventory-button inventory-button--primary" onClick={handleAdd} disabled={disabled || !canEdit}>
          Agregar prenda
        </button>
        <div className="inventory-toolbar__search">
          <label className="sr-only" htmlFor="inventory-search">
            Buscar en inventario
          </label>
          <input
            id="inventory-search"
            type="text"
            placeholder="Buscar por producto, SKU o color"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="inventory-toolbar__search-input"
            disabled={disabled || !token}
          />
        </div>
      </div>

      <div className="inventory-filters">
        <div className="inventory-filters__group">
          <label className="inventory-filters__field">
            Categoria
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} disabled={disabled || !token}>
              <option value="all">Todas</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="inventory-filters__field">
            Ubicacion
            <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} disabled={disabled || !token}>
              <option value="all">Todas</option>
              {locationOptions.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </label>
          <label className="inventory-filters__field">
            Estado
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={disabled || !token}>
              <option value="all">Todos</option>
              <option value="Disponible">Disponible</option>
              <option value="Bajo stock">Bajo stock</option>
              <option value="Agotado">Agotado</option>
            </select>
          </label>
          <label className="inventory-filters__field">
            Vista
            <select value={viewFilter} onChange={(event) => setViewFilter(event.target.value)} disabled={disabled || !token}>
              <option value="active">Activos</option>
              <option value="archived">Archivados</option>
              <option value="all">Todos</option>
            </select>
          </label>
          <label className="inventory-filters__field">
            Ordenar por
            <select value={sortField} onChange={(event) => setSortField(event.target.value)} disabled={disabled || !token}>
              <option value="name">Nombre</option>
              <option value="stock">Stock</option>
              <option value="price">Precio</option>
            </select>
          </label>
          <label className="inventory-filters__field">
            Direccion
            <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value)} disabled={disabled || !token}>
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </label>
        </div>

        <div className="inventory-filters__utilities">
          <button type="button" className="inventory-button inventory-button--ghost" onClick={handleExport} disabled={!hasItems || disabled || !token}>
            Exportar CSV
          </button>
          <button type="button" className="inventory-button inventory-button--ghost" onClick={() => fileInputRef.current?.click()} disabled={disabled || !token}>
            Importar CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" aria-label="Importar archivo CSV" onChange={handleImport} hidden />
        </div>
      </div>

      <div className="inventory-bulk">
        <div className="inventory-bulk__controls">
          <span className="inventory-bulk__label">Acciones masivas</span>
          <input
            type="text"
            placeholder="Nueva categoria"
            aria-label="Nueva categoria masiva"
            value={bulkCategory}
            onChange={(event) => setBulkCategory(event.target.value)}
            disabled={!selectedCount || disabled || !canEdit}
          />
          <input
            type="text"
            placeholder="Nueva ubicacion"
            aria-label="Nueva ubicacion masiva"
            value={bulkLocation}
            onChange={(event) => setBulkLocation(event.target.value)}
            disabled={!selectedCount || disabled || !canEdit}
          />
          <button type="button" className="inventory-button inventory-button--ghost" onClick={handleBulkUpdate} disabled={!selectedCount || disabled || !canEdit}>
            Aplicar cambios
          </button>
        </div>
        <div className="inventory-bulk__meta" aria-live="polite">
          <span>{selectedCount} seleccionados</span>
        </div>
      </div>
    </>
  )
}
