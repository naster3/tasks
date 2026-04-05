import { useCallback, useEffect, useState } from 'react'
import { ROLE_STORAGE_KEY, TOKEN_STORAGE_KEY } from '../services/api.js'

// Este hook encapsula el estado de autenticacion del frontend.
// Su objetivo es que el resto del feature no tenga que saber como se persiste
// la sesion ni como se reacciona a errores de autorizacion.
export const useInventorySession = ({ clearInventoryState }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_STORAGE_KEY) || '')
  const [role, setRole] = useState(() => sessionStorage.getItem(ROLE_STORAGE_KEY) || '')
  const [loginUser, setLoginUser] = useState('admin')
  const [loginPass, setLoginPass] = useState('')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }, [token])

  useEffect(() => {
    if (role) {
      sessionStorage.setItem(ROLE_STORAGE_KEY, role)
    } else {
      sessionStorage.removeItem(ROLE_STORAGE_KEY)
    }
  }, [role])

  const resetSessionState = useCallback(() => {
    setToken('')
    setRole('')
    clearInventoryState()
  }, [clearInventoryState])

  const handleAuthError = useCallback((error) => {
    // Un 401 se trata como perdida de sesion y obliga a limpiar estado.
    // Otros errores se informan, pero no destruyen el contexto actual.
    if (error?.status === 401) {
      setAuthError('Sesion expirada. Vuelve a iniciar.')
      resetSessionState()
      return
    }

    alert(error?.message || 'No se pudo completar la solicitud.')
  }, [resetSessionState])

  const isReadOnly = role === 'solo_lectura'

  return {
    authError,
    canArchive: role === 'admin',
    canEdit: Boolean(token) && !isReadOnly,
    handleAuthError,
    loginPass,
    loginUser,
    resetSessionState,
    role,
    setAuthError,
    setLoginPass,
    setLoginUser,
    setRole,
    setToken,
    token,
  }
}
