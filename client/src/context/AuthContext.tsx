
import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './authContextTypes'
import { apiRequest } from '../services/api'

interface AuthResponse {
  user: AuthUser
  token: string
}

interface SignupResponse {
  message: string
  user: AuthUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(
    () => Boolean(localStorage.getItem('retain_session')),
  )

  useEffect(() => {
    let active = true

    if (!localStorage.getItem('retain_session')) {
      return () => {
        active = false
      }
    }

    apiRequest<AuthUser>('/api/auth/me')
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem('retain_session')
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function authenticate(path: string, body: object) {
    const response = await apiRequest<AuthResponse>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    localStorage.setItem('retain_session', response.token)
    setUser(response.user)
  }

  async function signUp(name: string, email: string, password: string) {
    await apiRequest<SignupResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  }

  async function signIn(email: string, password: string) {
    await authenticate('/api/auth/signin', { email, password })
  }

  async function signOut() {
    try {
      await apiRequest<void>('/api/auth/signout', { method: 'POST' })
    } catch {
      // Clear the local session even if the server is temporarily unavailable.
    } finally {
      localStorage.removeItem('retain_session')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
