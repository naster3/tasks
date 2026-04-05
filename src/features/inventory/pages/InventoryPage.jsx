import { useRef } from 'react'
import AuditModal from '../components/AuditModal.jsx'
import InventoryAuthPanel from '../components/InventoryAuthPanel.jsx'
import InventoryFilters from '../components/InventoryFilters.jsx'
import InventorySummary from '../components/InventorySummary.jsx'
import InventoryTableGrid from '../components/InventoryTableGrid.jsx'
import MovementModal from '../components/MovementModal.jsx'
import ProductFormModal from '../components/ProductFormModal.jsx'
import { useInventory } from '../hooks/useInventory.js'
import '../styles/inventory.css'
import '../styles/product-form.css'

// InventoryPage es la pantalla contenedora del feature.
// Su trabajo principal es coordinar subcomponentes y repartir estado derivado
// sin mezclar detalles de render con logica remota o de sesion.
export default function InventoryPage() {
  const fileInputRef = useRef(null)
  const inventory = useInventory()

  // Estos grupos reducen la cantidad de props sueltas y hacen mas legible
  // la interfaz entre la pagina y cada subcomponente.
  const filterControls = {
    bulkCategory: inventory.bulkCategory,
    bulkLocation: inventory.bulkLocation,
    categoryFilter: inventory.categoryFilter,
    categoryOptions: inventory.categoryOptions,
    locationFilter: inventory.locationFilter,
    locationOptions: inventory.locationOptions,
    searchTerm: inventory.searchTerm,
    selectedCount: inventory.selectedIds.size,
    setBulkCategory: inventory.setBulkCategory,
    setBulkLocation: inventory.setBulkLocation,
    setCategoryFilter: inventory.setCategoryFilter,
    setLocationFilter: inventory.setLocationFilter,
    setSearchTerm: inventory.setSearchTerm,
    setSortDirection: inventory.setSortDirection,
    setSortField: inventory.setSortField,
    setStatusFilter: inventory.setStatusFilter,
    setViewFilter: inventory.setViewFilter,
    sortDirection: inventory.sortDirection,
    sortField: inventory.sortField,
    statusFilter: inventory.statusFilter,
    viewFilter: inventory.viewFilter,
  }
  const filterActions = {
    handleAdd: inventory.handleAdd,
    handleBulkUpdate: inventory.handleBulkUpdate,
    handleExport: inventory.handleExport,
    handleImport: inventory.handleImport,
  }
  const tableActions = {
    handleArchive: inventory.handleArchive,
    handleEdit: inventory.handleEdit,
    handleMovement: inventory.handleMovement,
    handleOpenAudit: inventory.handleOpenAudit,
    handleRestore: inventory.handleRestore,
  }
  const pagination = {
    currentPageSafe: inventory.currentPageSafe,
    pageSize: inventory.pageSize,
    setCurrentPage: inventory.setCurrentPage,
    setPageSize: inventory.setPageSize,
    totalPages: inventory.totalPages,
  }
  const selection = {
    isAllPageSelected: inventory.isAllPageSelected,
    selectedIds: inventory.selectedIds,
    toggleSelect: inventory.toggleSelect,
    toggleSelectAll: inventory.toggleSelectAll,
  }
  const permissions = {
    canArchive: inventory.canArchive,
    canEdit: inventory.canEdit,
    token: inventory.token,
  }

  return (
    <section className="inventory-page">
      <div className="inventory-page__hero">
        <div className="inventory-page__copy">
          <p className="inventory-page__eyebrow">Inventario</p>
          <h1>Ropa y accesorios</h1>
          <p className="inventory-page__subtitle">
            Controla stock, tallas, ubicaciones y auditoria completa desde una sola vista.
          </p>
        </div>
        <InventorySummary
          lowStock={inventory.inventoryTotals.lowStock}
          totalStock={inventory.inventoryTotals.totalStock}
        />
        <InventoryAuthPanel
          authError={inventory.authError}
          handleLogin={inventory.handleLogin}
          handleLogout={inventory.handleLogout}
          isLoading={inventory.isLoading}
          loginPass={inventory.loginPass}
          loginUser={inventory.loginUser}
          migrationStatus={inventory.migrationStatus}
          migrateLocalData={inventory.migrateLocalData}
          role={inventory.role}
          setLoginPass={inventory.setLoginPass}
          setLoginUser={inventory.setLoginUser}
          token={inventory.token}
        />
      </div>

      <InventoryFilters
        actions={filterActions}
        controls={filterControls}
        disabled={inventory.isFormOpen}
        fileInputRef={fileInputRef}
        hasItems={inventory.computedItems.length > 0}
        permissions={permissions}
      />

      <InventoryTableGrid
        actions={tableActions}
        disabled={inventory.isFormOpen}
        isLoading={inventory.isLoading}
        pageItems={inventory.pageItems}
        pagination={pagination}
        permissions={permissions}
        selection={selection}
      />

      {inventory.isFormOpen && (
        <ProductFormModal
          onSave={inventory.handleSaveItem}
          onClose={() => inventory.setIsFormOpen(false)}
          initialData={inventory.isEditMode ? inventory.currentItem : null}
          mode={inventory.isEditMode ? 'edit' : 'add'}
        />
      )}

      {inventory.movementItem && (
        <MovementModal
          item={inventory.movementItem}
          onSave={inventory.handleMovementSave}
          onClose={() => inventory.setMovementItem(null)}
        />
      )}

      {inventory.auditItem && (
        <AuditModal
          item={inventory.auditItem}
          onClose={() => inventory.setAuditItem(null)}
        />
      )}
    </section>
  )
}
