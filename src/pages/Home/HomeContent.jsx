import InventoryPage from '../../features/inventory/pages/InventoryPage.jsx'

// Este archivo define el contenido de la portada.
// Hoy solo monta el inventario, pero deja un punto claro para agregar
// otros bloques sin tocar el router ni el layout global.
export default function HomeContent() {
  return <InventoryPage />
}
