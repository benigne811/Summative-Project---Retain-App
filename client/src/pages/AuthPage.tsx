
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ReceiptText, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { apiRequest } from '../services/api'

function AuthPage() {
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isWaitingForServer, setIsWaitingForServer] = useState(false)

  useEffect(() => {
    void apiRequest<{ status: string }>('/api/health').catch(() => {
      // Sign-in still reports any connection issue when the user submits the form.
    })
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    setIsWaitingForServer(false)
    const slowConnectionTimer = window.setTimeout(
      () => setIsWaitingForServer(true),
      2500,
    )

    try {
      if (mode === 'signup') {
        await signUp(name, email, password)
        setMode('signin')
        setName('')
        setPassword('')
        setSuccess('Account created successfully. Please sign in.')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      window.clearTimeout(slowConnectionTimer)
      setIsSubmitting(false)
      setIsWaitingForServer(false)
    }
  }

  function changeMode(nextMode: 'signin' | 'signup') {
    setMode(nextMode)
    setError('')
    setSuccess('')
  }

  return (
    <main className="min-h-svh bg-[#f3f5ef] px-4 py-8 sm:px-6">
      <section className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center">
        <div className="w-full">
          <div className="mb-7 flex items-center gap-3 px-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#214a39] text-[#f5f3e9]">
              <ReceiptText size={21} strokeWidth={1.8} />
            </span>
            <span className="text-2xl font-semibold tracking-tight text-[#20362b]">
              retain<span className="text-emerald-600">.</span>
            </span>
          </div>

          <div className="rounded-[1.35rem] border border-[#dfe5dc] bg-white p-6 shadow-[0_18px_50px_-38px_rgba(32,54,43,0.4)] sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-[#20362b]">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h1>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'signup' && (
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1.5 min-h-12 w-full rounded-lg border border-[#d9e0d7] bg-[#fcfdfa] px-3.5 py-3 text-base outline-none transition focus:border-[#47735a] focus:ring-2 focus:ring-[#e4eee5]"
                  />
                </label>
              )}

              <label className="block text-sm font-medium text-slate-700">
                Email address
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5 min-h-12 w-full rounded-lg border border-[#d9e0d7] bg-[#fcfdfa] px-3.5 py-3 text-base outline-none transition focus:border-[#47735a] focus:ring-2 focus:ring-[#e4eee5]"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password
                <span className="relative mt-1.5 block">
                  <input
                    required
                    minLength={8}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={
                      mode === 'signin' ? 'current-password' : 'new-password'
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-h-12 w-full rounded-lg border border-[#d9e0d7] bg-[#fcfdfa] px-3.5 py-3 pr-12 text-base outline-none transition focus:border-[#47735a] focus:ring-2 focus:ring-[#e4eee5]"
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </span>
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  role="status"
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 min-h-12 w-full rounded-lg bg-[#214a39] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#173a2b] disabled:opacity-60"
              >
                {isSubmitting
                  ? mode === 'signin'
                    ? 'Signing in…'
                    : 'Creating account…'
                  : mode === 'signin'
                    ? 'Sign in'
                    : 'Create account'}
              </button>
              {isWaitingForServer && (
                <p role="status" className="text-center text-xs text-slate-500">
                  The first connection can take a little longer while the server starts.
                </p>
              )}
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              {mode === 'signin' ? 'New to Retain?' : 'Already registered?'}{' '}
              <button
                type="button"
                onClick={() =>
                  changeMode(mode === 'signin' ? 'signup' : 'signin')
                }
                className="font-semibold text-[#28533d] underline decoration-[#a9bca9] underline-offset-4 hover:text-[#173a2b]"
              >
                {mode === 'signin' ? 'Create an account' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking your session...</main>
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return <>{children}</>
}

export default AuthPage
