import { createInventoryItem } from './operations.js'
import { escapeCsvValue, mapCsvHeaders, parseCsv, parseNumber } from '../utils/index.js'

const CSV_HEADERS = ['SKU', 'Producto', 'Categoria', 'Talla', 'Color', 'Stock', 'Precio', 'Estado', 'Ubicacion']

// La lectura del archivo se separa porque FileReader es asincrono y su API
// basada en eventos ensucia la logica de importacion si se deja embebida.
const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(String(reader.result || ''))
    }

    reader.onerror = () => {
      reject(new Error('No se pudo leer el archivo.'))
    }

    reader.readAsText(file)
  })

export const exportInventoryCsv = (items) => {
  // Se exportan las columnas del dominio para que el archivo sirva como
  // reporte y tambien como plantilla de importacion futura.
  const rows = items.map((item) => [
    item.sku,
    item.name,
    item.category,
    item.size,
    item.color,
    item.stock,
    item.price,
    item.status,
    item.location,
  ])

  const csvContent = [CSV_HEADERS, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'inventario.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const importInventoryCsv = async ({ file, token }) => {
  // La importacion avanza fila por fila para poder omitir errores parciales
  // sin abortar todo el lote por un solo registro defectuoso.
  const content = await readFileAsText(file)
  const rows = parseCsv(content)

  if (rows.length === 0) {
    throw new Error('El archivo no tiene filas validas.')
  }

  const headerMap = mapCsvHeaders(rows[0])
  if (
    typeof headerMap.sku !== 'number' ||
    typeof headerMap.name !== 'number' ||
    typeof headerMap.category !== 'number' ||
    typeof headerMap.location !== 'number'
  ) {
    throw new Error('El CSV debe incluir columnas para SKU, Producto, Categoria y Ubicacion.')
  }

  const skipped = []
  let createdCount = 0

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index]
    if (!row || row.every((cell) => String(cell ?? '').trim() === '')) {
      continue
    }

    const getValue = (field) => row[headerMap[field]] ?? ''
    const name = String(getValue('name')).trim()
    const sku = String(getValue('sku')).trim().toUpperCase()
    const category = String(getValue('category')).trim()
    const location = String(getValue('location')).trim()

    if (!name || !sku || !category || !location) {
      skipped.push(index + 1)
      continue
    }

    const stockValue = parseNumber(getValue('stock'))
    const priceValue = parseNumber(getValue('price'))

    if (stockValue === null || priceValue === null || stockValue < 0 || priceValue < 0) {
      skipped.push(index + 1)
      continue
    }

    try {
      await createInventoryItem({
        payload: {
          sku,
          name,
          category,
          size: String(getValue('size')).trim().toUpperCase(),
          color: String(getValue('color')).trim(),
          price: Number(priceValue.toFixed(2)),
          location,
          initial_stock: stockValue,
        },
        token,
      })
      createdCount += 1
    } catch (error) {
      if (error?.status === 401) {
        throw error
      }
      skipped.push(index + 1)
    }
  }

  return { createdCount, skipped }
}
