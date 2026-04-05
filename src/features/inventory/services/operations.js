import { fetchJson, mapApiItem, mapAuditEntry, mapMovement } from './api.js'

// Esta funcion traduce el estado de filtros de la UI a query params del backend.
// Mantener la transformacion separada evita concatenar strings en varios puntos.
const buildQueryString = ({
  archived,
  searchTerm,
  categoryFilter,
  locationFilter,
  statusFilter,
  sortField,
  sortDirection,
}) => {
  const params = new URLSearchParams()
  if (searchTerm) params.set('q', searchTerm)
  if (categoryFilter !== 'all') params.set('category', categoryFilter)
  if (locationFilter !== 'all') params.set('location', locationFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)

  const sortKey = sortField === 'name' ? 'name' : sortField
  const sortValue = sortDirection === 'desc' ? `-${sortKey}` : sortKey

  params.set('sort', sortValue)
  params.set('archived', archived ? 'true' : 'false')

  return params.toString()
}

export const fetchInventoryItems = async ({ filters, token }) => {
  if (filters.viewFilter === 'all') {
    // "Todos" requiere dos llamadas porque el backend separa activos y archivados.
    // Luego se combinan en cliente para presentar una sola grilla unificada.
    const baseFilters = {
      searchTerm: filters.searchTerm,
      categoryFilter: filters.categoryFilter,
      locationFilter: filters.locationFilter,
      statusFilter: filters.statusFilter,
      sortField: filters.sortField,
      sortDirection: filters.sortDirection,
    }

    const [active, archived] = await Promise.all([
      fetchJson(`/items?${buildQueryString({ ...baseFilters, archived: false })}`, {}, token),
      fetchJson(`/items?${buildQueryString({ ...baseFilters, archived: true })}`, {}, token),
    ])

    return [...(active || []), ...(archived || [])].map(mapApiItem)
  }

  const query = buildQueryString({
    archived: filters.viewFilter === 'archived',
    searchTerm: filters.searchTerm,
    categoryFilter: filters.categoryFilter,
    locationFilter: filters.locationFilter,
    statusFilter: filters.statusFilter,
    sortField: filters.sortField,
    sortDirection: filters.sortDirection,
  })

  const data = await fetchJson(`/items?${query}`, {}, token)
  return (data || []).map(mapApiItem)
}

export const loginWithCredentials = ({ username, password }) =>
  fetchJson(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    ''
  )

export const createInventoryItem = ({ payload, token }) =>
  fetchJson('/items', { method: 'POST', body: JSON.stringify(payload) }, token)

export const updateInventoryItem = ({ itemId, payload, token }) =>
  fetchJson(`/items/${itemId}`, { method: 'PUT', body: JSON.stringify(payload) }, token)

export const archiveInventoryItem = ({ itemId, token }) =>
  fetchJson(`/items/${itemId}`, { method: 'DELETE' }, token)

export const restoreInventoryItem = ({ itemId, token }) =>
  fetchJson(`/items/${itemId}/restore`, { method: 'POST' }, token)

export const createInventoryMovement = ({ payload, token }) =>
  fetchJson('/movements', { method: 'POST', body: JSON.stringify(payload) }, token)

export const fetchInventoryAudit = async ({ item, token }) => {
  // La bitacora completa se arma juntando movimientos y auditoria estructural.
  const [movements, audit] = await Promise.all([
    fetchJson(`/items/${item.id}/movements`, {}, token),
    fetchJson(`/items/${item.id}/audit`, {}, token),
  ])

  return {
    ...item,
    movements: (movements || []).map(mapMovement),
    audit: (audit || []).map(mapAuditEntry),
  }
}
