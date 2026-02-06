import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './shared/styles/globals.css'
import router from './app/router.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)
