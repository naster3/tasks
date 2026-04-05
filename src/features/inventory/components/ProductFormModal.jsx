import { useEffect, useId, useState } from 'react'

const blankForm = {
  name: '',
  sku: '',
  category: '',
  size: '',
  color: '',
  price: '',
  location: '',
  initialStock: '',
}

// Este modal encapsula la captura y validacion previa de una ficha de producto.
// La API sigue siendo la fuente de verdad, pero aqui se filtran errores basicos
// para evitar solicitudes invalidas y dar respuesta rapida al usuario.
export default function ProductFormModal({
  onSave,
  onClose,
  initialData = null,
  mode = 'add',
}) {
  const headingId = useId()
  const [formData, setFormData] = useState(() => ({ ...blankForm }))

  useEffect(() => {
    if (initialData) {
      // En modo edicion se reutiliza la ficha actual, pero no el stock inicial
      // porque ese valor solo tiene sentido durante el alta del producto.
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        category: initialData.category || '',
        size: initialData.size || '',
        color: initialData.color || '',
        price: initialData.price !== undefined ? String(initialData.price) : '',
        location: initialData.location || '',
        initialStock: '',
      })
    } else {
      setFormData({ ...blankForm })
    }
  }, [initialData])

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => setFormData({ ...blankForm })

  const handleSave = () => {
    const { name, sku, category, size, color, price, location, initialStock } = formData
    const trimmedName = name.trim()
    const trimmedSku = sku.trim()
    const trimmedCategory = category.trim()
    const trimmedLocation = location.trim()

    if (!trimmedName || !trimmedSku || !trimmedCategory || !trimmedLocation) {
      alert('Completa nombre, SKU, categoria y ubicacion para guardar la prenda.')
      return
    }

    const parsedPrice = price === '' ? 0 : Number(price)
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      alert('El precio debe ser un numero no negativo.')
      return
    }

    const parsedInitialStock = mode === 'add' ? (initialStock === '' ? 0 : Number(initialStock)) : 0
    if (Number.isNaN(parsedInitialStock) || parsedInitialStock < 0) {
      alert('El stock inicial debe ser un numero no negativo.')
      return
    }

    onSave({
      name: trimmedName,
      sku: trimmedSku.toUpperCase(),
      category: trimmedCategory,
      size: size.trim().toUpperCase(),
      color: color.trim(),
      price: Number(parsedPrice.toFixed(2)),
      location: trimmedLocation,
      initialStock: parsedInitialStock,
    })
  }

  return (
    <div className="inventory-form__overlay">
      <div className="inventory-form__container" role="dialog" aria-modal="true" aria-labelledby={headingId}>
        <button type="button" className="inventory-dialog__close" aria-label="Cerrar formulario de producto" onClick={onClose}>
          X
        </button>
        <p className="inventory-page__eyebrow">Ficha de producto</p>
        <h2 id={headingId}>{mode === 'edit' ? 'Editar prenda' : 'Agregar prenda'}</h2>

        <div className="inventory-form__grid">
          <label>
            Producto
            <input
              type="text"
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Ej. Camisa oxford"
            />
          </label>
          <label>
            SKU
            <input
              type="text"
              value={formData.sku}
              onChange={(event) => updateField('sku', event.target.value)}
              placeholder="Ej. CAM-001"
            />
          </label>
          <label>
            Categoria
            <input
              type="text"
              value={formData.category}
              onChange={(event) => updateField('category', event.target.value)}
              placeholder="Camisas, Chaquetas..."
            />
          </label>
          <label>
            Talla
            <input
              type="text"
              value={formData.size}
              onChange={(event) => updateField('size', event.target.value)}
              placeholder="S, M, 32..."
            />
          </label>
          <label>
            Color
            <input
              type="text"
              value={formData.color}
              onChange={(event) => updateField('color', event.target.value)}
              placeholder="Azul, Negro..."
            />
          </label>
          <label>
            Precio
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(event) => updateField('price', event.target.value)}
            />
          </label>
          {mode === 'add' && (
            <label>
              Stock inicial
              <input
                type="number"
                min="0"
                step="1"
                value={formData.initialStock}
                onChange={(event) => updateField('initialStock', event.target.value)}
              />
            </label>
          )}
          <label>
            Ubicacion
            <input
              type="text"
              value={formData.location}
              onChange={(event) => updateField('location', event.target.value)}
              placeholder="Almacen A, Tienda..."
            />
          </label>
        </div>

        <div className="inventory-form__actions">
          <button type="button" className="inventory-button inventory-button--primary" onClick={handleSave}>
            {mode === 'edit' ? 'Actualizar' : 'Guardar'}
          </button>
          <button type="button" className="inventory-button inventory-button--secondary" onClick={resetForm}>
            Limpiar
          </button>
          <button type="button" className="inventory-button inventory-button--ghost" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
