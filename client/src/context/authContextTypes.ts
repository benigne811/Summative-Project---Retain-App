import { createContext } from 'react'

export type UserRole = 'user' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  signUp: (name: string, email: string, password: string) => void
  signIn: (email: string, password: string) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
)
