import { computeStatus } from '../utils/index.js'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
export const TOKEN_STORAGE_KEY = 'inventory-api-token'
export const ROLE_STORAGE_KEY = 'inventory-api-role'

// Estos mapeadores desacoplan el contrato del backend del contrato que usa la UI.
// Si el backend cambia nombres de campos, el impacto queda contenido aqui.
export const mapApiItem = (item) => ({
  id: item.id,
  sku: item.sku,
  name: item.name,
  category: item.category,
  size: item.size || '',
  color: item.color || '',
  price: Number(item.price || 0),
  location: item.location,
  createdAt: item.created_at,
  createdBy: item.created_by,
  updatedAt: item.updated_at,
  updatedBy: item.updated_by,
  archivedAt: item.archived_at,
  archivedBy: item.archived_by,
  stock: item.stock ?? 0,
  status: item.status || computeStatus(item.stock ?? 0),
})

export const mapMovement = (movement) => ({
  id: movement.id,
  type: movement.type,
  qty: movement.qty,
  note: movement.note,
  createdAt: movement.created_at,
  createdBy: movement.created_by,
})

export const mapAuditEntry = (entry) => ({
  id: entry.id,
  action: entry.action,
  actor: entry.actor,
  note: entry.note,
  before: entry.before,
  after: entry.after,
  createdAt: entry.created_at,
})

export const fetchJson = async (path, options = {}, token) => {
  // El helper centraliza headers, parseo tolerante y errores consistentes
  // para que los servicios concretos se enfoquen en reglas de negocio.
  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    const error = new Error((data && data.error) || 'Request failed')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
