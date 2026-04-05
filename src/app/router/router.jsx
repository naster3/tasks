import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout.jsx'
import GuidePage from '../../pages/guide/GuidePage.jsx'
import HomePage from '../../pages/home/HomePage.jsx'

// El router se mantiene declarativo: solo conecta rutas con layouts y paginas.
// Toda la logica de negocio y presentacion detallada vive fuera de esta capa.
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/guide',
        element: <GuidePage />,
      },
    ],
  },
])

export default router
