import { Outlet } from 'react-router-dom'
import AppHeader from '../../features/layout/components/AppHeader.jsx'

// El layout raiz define la estructura compartida por todas las rutas.
// De esta manera el encabezado y el contenedor principal no se repiten
// pagina por pagina y cualquier ajuste global queda centralizado.
export default function AppLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
