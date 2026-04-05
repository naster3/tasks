import { useCallback } from 'react'
import {
  archiveInventoryItem,
  createInventoryItem,
  createInventoryMovement,
  restoreInventoryItem,
  updateInventoryItem,
} from '../services/operations.js'
import { loadLocalInventory } from '../utils/index.js'

// Este hook agrupa acciones con efectos secundarios:
// llamadas remotas, migraciones y actualizaciones masivas.
export const useInventoryActions = ({
  editor,
  loading,
  migration,
  permissions,
  refreshItems,
  selection,
}) => {
  const { currentItem, isEditMode, movementItem, setCurrentItem, setIsEditMode, setIsFormOpen, setMovementItem } = editor
  const { setIsLoading } = loading
  const { setMigrationStatus } = migration
  const { canArchive, canEdit, handleAuthError, token } = permissions
  const { bulkCategory, bulkLocation, clearSelection, computedItems, resetBulkFields, selectedIds } = selection

  const runWithLoading = useCallback(async (task) => {
    // Este envoltorio evita repetir manejo de carga y errores en cada accion.
    setIsLoading(true)
    try {
      await task()
    } catch (error) {
      handleAuthError(error)
    } finally {
      setIsLoading(false)
    }
  }, [handleAuthError, setIsLoading])

  const migrateLocalData = useCallback(async () => {
    if (!token) return

    // La migracion solo existe como puente para usuarios que aun conservan
    // datos en localStorage de una version anterior del frontend.
    const localItems = loadLocalInventory()
    if (!localItems.length) {
      setMigrationStatus('No hay datos locales para migrar.')
      return
    }

    setMigrationStatus('')
    let created = 0
    let skipped = 0

    await runWithLoading(async () => {
      for (const item of localItems) {
        if (!item.sku || !item.name || !item.category || !item.location) {
          skipped += 1
          continue
        }

        try {
          await createInventoryItem({
            payload: {
              sku: item.sku,
              name: item.name,
              category: item.category,
              size: item.size,
              color: item.color,
              price: item.price,
              location: item.location,
              initial_stock: item.stock,
            },
            token,
          })
          created += 1
        } catch {
          skipped += 1
        }
      }

      await refreshItems()
      setMigrationStatus(`Migracion lista. Creados: ${created}. Omitidos: ${skipped}.`)
    })
  }, [refreshItems, runWithLoading, setMigrationStatus, token])

  const handleSaveItem = useCallback(async (itemData) => {
    if (!token) return

    await runWithLoading(async () => {
      const { initialStock = 0, ...payload } = itemData

      if (isEditMode && currentItem) {
        // En edicion solo se altera la ficha.
        // El stock se toca exclusivamente a traves de movimientos.
        await updateInventoryItem({
          itemId: currentItem.id,
          payload,
          token,
        })
      } else {
        await createInventoryItem({
          payload: { ...payload, initial_stock: initialStock },
          token,
        })
      }

      await refreshItems()
      setIsFormOpen(false)
      setIsEditMode(false)
      setCurrentItem(null)
    })
  }, [
    currentItem,
    isEditMode,
    refreshItems,
    runWithLoading,
    setCurrentItem,
    setIsEditMode,
    setIsFormOpen,
    token,
  ])

  const handleArchive = useCallback(async (item) => {
    if (!token || !canArchive) return

    await runWithLoading(async () => {
      await archiveInventoryItem({ itemId: item.id, token })
      await refreshItems()
      clearSelection()
    })
  }, [canArchive, clearSelection, refreshItems, runWithLoading, token])

  const handleRestore = useCallback(async (item) => {
    if (!token || !canArchive) return

    await runWithLoading(async () => {
      await restoreInventoryItem({ itemId: item.id, token })
      await refreshItems()
    })
  }, [canArchive, refreshItems, runWithLoading, token])

  const handleMovement = useCallback((item) => {
    if (!canEdit) return
    setMovementItem(item)
  }, [canEdit, setMovementItem])

  const handleMovementSave = useCallback(async (movementData) => {
    if (!movementItem || !token) return

    await runWithLoading(async () => {
      await createInventoryMovement({
        payload: {
          item_id: movementItem.id,
          type: movementData.type,
          qty: movementData.qty,
          note: movementData.note,
        },
        token,
      })
      await refreshItems()
      setMovementItem(null)
    })
  }, [movementItem, refreshItems, runWithLoading, setMovementItem, token])

  const handleBulkUpdate = useCallback(async () => {
    if (!token || !canEdit) return

    if (!selectedIds.size) {
      alert('Selecciona productos para aplicar cambios masivos.')
      return
    }

    if (!bulkCategory && !bulkLocation) {
      alert('Define categoria o ubicacion para el cambio masivo.')
      return
    }

    await runWithLoading(async () => {
      // El cambio masivo se aplica solo a elementos seleccionados y activos;
      // se evita tocar archivados porque suelen representar historial cerrado.
      const updates = computedItems
        .filter((item) => selectedIds.has(item.id) && !item.archivedAt)
        .map((item) =>
          updateInventoryItem({
            itemId: item.id,
            payload: {
              category: bulkCategory || item.category,
              location: bulkLocation || item.location,
            },
            token,
          })
        )

      await Promise.all(updates)
      await refreshItems()
      clearSelection()
      resetBulkFields()
    })
  }, [
    bulkCategory,
    bulkLocation,
    canEdit,
    clearSelection,
    computedItems,
    refreshItems,
    resetBulkFields,
    runWithLoading,
    selectedIds,
    token,
  ])

  return {
    handleArchive,
    handleBulkUpdate,
    handleMovement,
    handleMovementSave,
    handleRestore,
    handleSaveItem,
    migrateLocalData,
  }
}
