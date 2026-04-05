import { useCallback, useEffect, useMemo, useState } from 'react'
import { computeStatus } from '../utils/index.js'

// Este hook concentra todo el estado derivado de la tabla:
// filtros, paginacion, seleccion y metricas visibles en pantalla.
export const useInventoryTableState = (items) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewFilter, setViewFilter] = useState('active')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkLocation, setBulkLocation] = useState('')

  useEffect(() => {
    // Cuando cambia cualquier filtro u orden, volver a la primera pagina
    // evita resultados vacios por haber quedado en una pagina vieja.
    setCurrentPage(1)
    setSelectedIds(new Set())
  }, [searchTerm, categoryFilter, locationFilter, statusFilter, viewFilter, sortField, sortDirection])

  const computedItems = useMemo(() => (
    // Se normaliza stock y estado para que la UI no dependa de pequenos
    // detalles de serializacion que puedan variar entre respuestas.
    items.map((item) => ({
      ...item,
      stock: Number(item.stock ?? 0),
      status: item.status || computeStatus(Number(item.stock ?? 0)),
    }))
  ), [items])

  const categoryOptions = useMemo(() => (
    Array.from(new Set(computedItems.map((item) => item.category).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    )
  ), [computedItems])

  const locationOptions = useMemo(() => (
    Array.from(new Set(computedItems.map((item) => item.location).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    )
  ), [computedItems])

  const totalPages = Math.max(1, Math.ceil(computedItems.length / pageSize))
  const currentPageSafe = Math.min(currentPage, totalPages)

  const pageItems = useMemo(() => {
    // El recorte por pagina se hace al final, una vez que la lista ya llega
    // filtrada y ordenada desde el backend.
    const start = (currentPageSafe - 1) * pageSize
    return computedItems.slice(start, start + pageSize)
  }, [computedItems, currentPageSafe, pageSize])

  useEffect(() => {
    if (currentPage !== currentPageSafe) {
      setCurrentPage(currentPageSafe)
    }
  }, [currentPage, currentPageSafe])

  const inventoryTotals = useMemo(() => {
    const activeItems = computedItems.filter((item) => !item.archivedAt)
    const totalStock = activeItems.reduce((sum, item) => sum + Number(item.stock || 0), 0)
    const lowStock = activeItems.filter((item) => item.stock > 0 && item.stock < 10).length
    return { totalStock, lowStock }
  }, [computedItems])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const resetBulkFields = useCallback(() => {
    setBulkCategory('')
    setBulkLocation('')
  }, [])

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback((checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        pageItems.forEach((item) => next.add(item.id))
      } else {
        pageItems.forEach((item) => next.delete(item.id))
      }
      return next
    })
  }, [pageItems])

  const isAllPageSelected = pageItems.length > 0 && pageItems.every((item) => selectedIds.has(item.id))

  return {
    bulkCategory,
    bulkLocation,
    categoryFilter,
    categoryOptions,
    clearSelection,
    computedItems,
    currentPageSafe,
    inventoryTotals,
    isAllPageSelected,
    locationFilter,
    locationOptions,
    pageItems,
    pageSize,
    resetBulkFields,
    searchTerm,
    selectedIds,
    setBulkCategory,
    setBulkLocation,
    setCategoryFilter,
    setCurrentPage,
    setLocationFilter,
    setPageSize,
    setSearchTerm,
    setSortDirection,
    setSortField,
    setStatusFilter,
    setViewFilter,
    sortDirection,
    sortField,
    statusFilter,
    toggleSelect,
    toggleSelectAll,
    totalPages,
    viewFilter,
  }
}
