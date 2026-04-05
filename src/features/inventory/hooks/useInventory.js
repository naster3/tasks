import { useCallback, useEffect, useState } from 'react'
import { exportInventoryCsv, importInventoryCsv } from '../services/csv.js'
import {
  fetchInventoryAudit,
  fetchInventoryItems,
  loginWithCredentials,
} from '../services/operations.js'
import { useInventoryActions } from './useInventoryActions.js'
import { useInventorySession } from './useInventorySession.js'
import { useInventoryTableState } from './useInventoryTableState.js'

// Este hook es el orquestador del feature de inventario.
// Reune sesion, filtros, operaciones remotas, modales y acciones de UI
// para que la pagina solo consuma un contrato compacto.
export const useInventory = () => {
  const [items, setItems] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [movementItem, setMovementItem] = useState(null)
  const [auditItem, setAuditItem] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState('')

  const clearInventoryState = useCallback(() => {
    // Al cerrar sesion o perder autorizacion se limpia cualquier contexto
    // sensible que pudiera quedar abierto en pantalla.
    setItems([])
    setCurrentItem(null)
    setAuditItem(null)
    setMovementItem(null)
    setIsEditMode(false)
    setIsFormOpen(false)
  }, [])

  const session = useInventorySession({ clearInventoryState })
  const table = useInventoryTableState(items)
  const { handleAuthError, setAuthError, token } = session
  const {
    categoryFilter,
    clearSelection,
    locationFilter,
    searchTerm,
    sortDirection,
    sortField,
    statusFilter,
    viewFilter,
  } = table

  const loadItems = useCallback(async () => {
    // Si no hay token, la pantalla se mantiene en modo invitado y evita
    // solicitudes que terminarian rechazadas por el backend.
    if (!token) return

    setIsLoading(true)
    setAuthError('')

    try {
      const nextItems = await fetchInventoryItems({
        filters: {
          categoryFilter,
          locationFilter,
          searchTerm,
          sortDirection,
          sortField,
          statusFilter,
          viewFilter,
        },
        token,
      })

      setItems(nextItems)
      clearSelection()
    } catch (error) {
      handleAuthError(error)
    } finally {
      setIsLoading(false)
    }
  }, [
    categoryFilter,
    clearSelection,
    handleAuthError,
    locationFilter,
    searchTerm,
    setAuthError,
    sortDirection,
    sortField,
    statusFilter,
    token,
    viewFilter,
  ])

  const actions = useInventoryActions({
    editor: {
      currentItem,
      isEditMode,
      movementItem,
      setCurrentItem,
      setIsEditMode,
      setIsFormOpen,
      setMovementItem,
    },
    loading: {
      setIsLoading,
    },
    migration: {
      setMigrationStatus,
    },
    permissions: {
      canArchive: session.canArchive,
      canEdit: session.canEdit,
      handleAuthError: session.handleAuthError,
      token: session.token,
    },
    refreshItems: loadItems,
    selection: {
      bulkCategory: table.bulkCategory,
      bulkLocation: table.bulkLocation,
      clearSelection: table.clearSelection,
      computedItems: table.computedItems,
      resetBulkFields: table.resetBulkFields,
      selectedIds: table.selectedIds,
    },
  })

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleLogin = async () => {
    // La validacion minima se hace en cliente para no disparar peticiones
    // vacias y para ofrecer feedback inmediato.
    if (!session.loginUser || !session.loginPass) {
      session.setAuthError('Completa usuario y password.')
      return
    }

    setIsLoading(true)
    session.setAuthError('')

    try {
      const data = await loginWithCredentials({
        username: session.loginUser,
        password: session.loginPass,
      })

      session.setToken(data.token)
      session.setRole(data.role)
      session.setLoginPass('')
    } catch (error) {
      session.setAuthError(error?.data?.error || error?.message || 'Login fallido.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    session.resetSessionState()
    session.setAuthError('')
    table.clearSelection()
    table.resetBulkFields()
    setMigrationStatus('')
  }

  const handleEdit = (item) => {
    if (!session.canEdit) return
    setCurrentItem(item)
    setIsEditMode(true)
    setIsFormOpen(true)
  }

  const handleAdd = () => {
    if (!session.canEdit) return
    setCurrentItem(null)
    setIsEditMode(false)
    setIsFormOpen(true)
  }

  const handleOpenAudit = async (item) => {
    if (!session.token) return

    // La bitacora se pide bajo demanda para no sobrecargar la consulta
    // principal de inventario con historicos que aun no se necesitan.
    setIsLoading(true)
    try {
      const nextAuditItem = await fetchInventoryAudit({ item, token: session.token })
      setAuditItem(nextAuditItem)
    } catch (error) {
      session.handleAuthError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    // Se exporta la vista computada actual para respetar filtros y orden
    // que el usuario ya tiene visibles en pantalla.
    exportInventoryCsv(table.computedItems)
  }

  const handleImport = async (event) => {
    if (!session.token) return

    const file = event.target.files?.[0]
    if (!file) return

    try {
      const { createdCount, skipped } = await importInventoryCsv({
        file,
        token: session.token,
      })

      if (createdCount > 0) {
        await loadItems()
      }

      if (skipped.length) {
        alert(`Se omitieron ${skipped.length} filas por datos invalidos o SKU duplicado.`)
      }
    } catch (error) {
      if (error?.status === 401) {
        session.handleAuthError(error)
      } else {
        alert(error?.message || 'No se pudo importar el archivo.')
      }
    } finally {
      event.target.value = ''
    }
  }

  return {
    auditItem,
    authError: session.authError,
    bulkCategory: table.bulkCategory,
    bulkLocation: table.bulkLocation,
    canArchive: session.canArchive,
    canEdit: session.canEdit,
    categoryFilter: table.categoryFilter,
    categoryOptions: table.categoryOptions,
    computedItems: table.computedItems,
    currentItem,
    currentPageSafe: table.currentPageSafe,
    handleAdd,
    handleArchive: actions.handleArchive,
    handleBulkUpdate: actions.handleBulkUpdate,
    handleEdit,
    handleExport,
    handleImport,
    handleLogin,
    handleLogout,
    handleMovement: actions.handleMovement,
    handleMovementSave: actions.handleMovementSave,
    handleOpenAudit,
    handleRestore: actions.handleRestore,
    handleSaveItem: actions.handleSaveItem,
    inventoryTotals: table.inventoryTotals,
    isAllPageSelected: table.isAllPageSelected,
    isEditMode,
    isFormOpen,
    isLoading,
    locationFilter: table.locationFilter,
    locationOptions: table.locationOptions,
    loginPass: session.loginPass,
    loginUser: session.loginUser,
    migrateLocalData: actions.migrateLocalData,
    migrationStatus,
    movementItem,
    pageItems: table.pageItems,
    pageSize: table.pageSize,
    role: session.role,
    searchTerm: table.searchTerm,
    selectedIds: table.selectedIds,
    setAuditItem,
    setBulkCategory: table.setBulkCategory,
    setBulkLocation: table.setBulkLocation,
    setCategoryFilter: table.setCategoryFilter,
    setCurrentPage: table.setCurrentPage,
    setIsEditMode,
    setIsFormOpen,
    setLocationFilter: table.setLocationFilter,
    setLoginPass: session.setLoginPass,
    setLoginUser: session.setLoginUser,
    setMovementItem,
    setPageSize: table.setPageSize,
    setSearchTerm: table.setSearchTerm,
    setSortDirection: table.setSortDirection,
    setSortField: table.setSortField,
    setStatusFilter: table.setStatusFilter,
    setViewFilter: table.setViewFilter,
    sortDirection: table.sortDirection,
    sortField: table.sortField,
    statusFilter: table.statusFilter,
    token: session.token,
    toggleSelect: table.toggleSelect,
    toggleSelectAll: table.toggleSelectAll,
    totalPages: table.totalPages,
    viewFilter: table.viewFilter,
  }
}
