import { useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './authContextTypes'

interface Account extends AuthUser {
  password: string
}

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

    setUser({
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
    })
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

    setUser({
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
    })
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
