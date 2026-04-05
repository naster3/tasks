// Este panel encapsula autenticacion, cierre de sesion y migracion de datos
// locales heredados. Agrupar esos controles evita mezclar acceso con filtros
// y acciones operativas del inventario.
export default function InventoryAuthPanel({
  authError,
  handleLogin,
  handleLogout,
  isLoading,
  loginPass,
  loginUser,
  migrationStatus,
  migrateLocalData,
  role,
  setLoginPass,
  setLoginUser,
  token,
}) {
  return (
    <div className="inventory-auth-panel" aria-label="Panel de autenticacion y migracion">
      {!token ? (
        <>
          <input
            type="text"
            placeholder="Usuario"
            aria-label="Usuario"
            autoComplete="username"
            value={loginUser}
            onChange={(event) => setLoginUser(event.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            aria-label="Contrasena"
            autoComplete="current-password"
            value={loginPass}
            onChange={(event) => setLoginPass(event.target.value)}
          />
          <button type="button" className="inventory-button inventory-button--ghost" onClick={handleLogin} disabled={isLoading}>
            Iniciar sesion
          </button>
        </>
      ) : (
        <>
          <span className="inventory-auth-panel__chip">Rol: {role || 'N/A'}</span>
          <button type="button" className="inventory-button inventory-button--ghost" onClick={handleLogout} disabled={isLoading}>
            Cerrar sesion
          </button>
        </>
      )}

      {authError && <span className="inventory-auth-panel__error" aria-live="assertive">{authError}</span>}

      {token && (
        <>
          <button type="button" className="inventory-button inventory-button--ghost" onClick={migrateLocalData} disabled={isLoading}>
            Migrar datos locales
          </button>
          {migrationStatus && <span className="inventory-auth-panel__note" aria-live="polite">{migrationStatus}</span>}
        </>
      )}
    </div>
  )
}
