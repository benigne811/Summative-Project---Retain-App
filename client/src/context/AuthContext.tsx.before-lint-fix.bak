
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'

export type UserRole = 'user' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

interface Account extends AuthUser {
  password: string
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  signUp: (name: string, email: string, password: string) => void
  signIn: (email: string, password: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [user, setUser] = useState<AuthUser | null>(null)

  function signUp(name: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()

    if (!name.trim() || !normalizedEmail || !password) {
      throw new Error('Please complete all required fields.')
    }

    if (password.length < 8) {
      throw new Error('Your password must contain at least 8 characters.')
    }

    if (accounts.some((account) => account.email === normalizedEmail)) {
      throw new Error('An account with this email already exists.')
    }

    const newAccount: Account = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
    }

    setAccounts((previousAccounts) => [...previousAccounts, newAccount])

    const { password: _password, ...newUser } = newAccount
    setUser(newUser)
  }

  function signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()

    const account = accounts.find(
      (item) =>
        item.email === normalizedEmail && item.password === password,
    )

    if (!account) {
      throw new Error(
        'Invalid email or password. Please check your details or create an account.',
      )
    }

    const { password: _password, ...authenticatedUser } = account
    setUser(authenticatedUser)
  }

  function signOut() {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
