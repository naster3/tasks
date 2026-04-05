import { FiLifeBuoy, FiPackage } from 'react-icons/fi'
import { NavLink } from 'react-router-dom'
import '../styles/app-header.css'

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Inventario',
    icon: FiPackage,
  },
  {
    to: '/guide',
    label: 'Guia',
    icon: FiLifeBuoy,
  },
]

// El encabezado pertenece al feature de layout porque es navegacion global.
// Ningun modulo concreto deberia decidir por si solo como luce esta cabecera.
export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header__content">
        <NavLink to="/" className="app-header__brand">
          <span className="app-header__brand-mark">DN</span>
          <div>
            <strong>DevNaster</strong>
            <span>Control de inventario web</span>
          </div>
        </NavLink>

        <nav aria-label="Navegacion principal" className="app-header__nav">
          {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `app-header__link${isActive ? ' app-header__link--active' : ''}`
              }
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
