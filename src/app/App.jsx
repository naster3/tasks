import { RouterProvider } from 'react-router-dom'
import router from './router/router.jsx'

// Este componente concentra la inicializacion de la aplicacion web.
// Mantener el router aqui evita que main.jsx conozca detalles internos
// de navegacion, layouts o paginas concretas.
export default function App() {
  return <RouterProvider router={router} />
}
