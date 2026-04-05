import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/roboto'
import './app/styles/global.css'
import App from './app/App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
