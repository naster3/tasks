const LEGACY_STORAGE_KEYS = ['inventory-items-v2', 'inventory-items-v1']

// El estado visual del producto se deriva del stock actual para que la UI
// mantenga una regla consistente sin depender de etiquetas hardcodeadas.
export const computeStatus = (stock) => {
  if (stock === 0) return 'Agotado'
  if (stock < 10) return 'Bajo stock'
  return 'Disponible'
}

export const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeLocalItems = (rawItems) => {
  if (!Array.isArray(rawItems)) return []
  return rawItems.map((item) => {
    const stock = Number(item.stock ?? 0)
    return {
      sku: String(item.sku || '').trim().toUpperCase(),
      name: String(item.name || '').trim(),
      category: String(item.category || '').trim(),
      size: String(item.size || '').trim().toUpperCase(),
      color: String(item.color || '').trim(),
      price: Number(Number(item.price || 0).toFixed(2)),
      location: String(item.location || '').trim(),
      stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
    }
  })
}

export const loadLocalInventory = () => {
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return normalizeLocalItems(parsed)
    } catch {
      // Se ignoran datos corruptos para no romper el arranque por residuos
      // de versiones anteriores guardadas en el navegador.
    }
  }
  return []
}

export const escapeCsvValue = (value) => {
  const stringValue = String(value ?? '')
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export const parseCsv = (text) => {
  // Se usa un parser pequeno propio porque el formato esperado es simple
  // y asi se evita introducir una dependencia externa solo por CSV.
  const rows = []
  let current = ''
  let row = []
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(current)
      current = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1
      }
      row.push(current)
      if (row.length > 1 || row[0] !== '') {
        rows.push(row)
      }
      row = []
      current = ''
      continue
    }

    current += char
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current)
    rows.push(row)
  }

  return rows
}

export const mapCsvHeaders = (headers) => {
  // Los alias permiten importar archivos con encabezados ligeramente distintos
  // sin obligar al usuario a usar una plantilla exacta al caracter.
  const normalized = headers.map((value) => String(value).trim().toLowerCase().replace(/\s+/g, ''))
  const aliases = {
    sku: ['sku', 'codigo'],
    name: ['name', 'producto', 'nombre'],
    category: ['category', 'categoria'],
    size: ['size', 'talla'],
    color: ['color'],
    stock: ['stock'],
    price: ['price', 'precio'],
    location: ['location', 'ubicacion'],
  }

  const mapping = {}
  Object.entries(aliases).forEach(([field, values]) => {
    const index = normalized.findIndex((header) => values.includes(header))
    if (index !== -1) {
      mapping[field] = index
    }
  })

  return mapping
}

export const statusClass = (status) => {
  if (status === 'Disponible') return 'inventory-status-pill inventory-status-pill--available'
  if (status === 'Agotado') return 'inventory-status-pill inventory-status-pill--out'
  return 'inventory-status-pill inventory-status-pill--low'
}

export const formatPrice = (value) => `$${Number(value).toFixed(2)}`
