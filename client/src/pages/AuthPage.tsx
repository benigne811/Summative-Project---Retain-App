
import { useState, type FormEvent, type ReactNode } from 'react'
import { Wallet, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/useAuth'

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

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
      setIsSubmitting(false)
    }
  }

  function changeMode(nextMode: 'signin' | 'signup') {
    setMode(nextMode)
    setError('')
    setSuccess('')
  }

  return (
    <main className="flex min-h-screen bg-white">
      <section className="flex w-full items-center justify-center px-5 py-12 sm:px-10 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Wallet size={25} />
            </span>
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              retain<span className="text-emerald-600">.</span>
            </span>
          </div>

          <p className="text-sm font-semibold text-emerald-700">
            YOUR MONEY, THOUGHTFULLY MANAGED
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {mode === 'signin'
              ? 'Sign in to keep track of your expenses and stay on budget.'
              : 'Start building better financial habits with Retain.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === 'signup' && (
              <label className="block text-sm font-medium text-slate-700">
                Full name
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <span className="relative mt-2 block">
                <input
                  required
                  minLength={8}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={
                    mode === 'signin' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            {mode === 'signin'
              ? "Don't have an account?"
              : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() =>
                changeMode(mode === 'signin' ? 'signup' : 'signin')
              }
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <p className="mt-10 text-center text-xs text-slate-400">
            Retain Â© 2026 Â· Make every shilling count.
          </p>
        </div>
      </section>

      <aside className="relative hidden flex-1 items-center justify-center overflow-hidden bg-emerald-950 p-12 lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-700/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />

        <div className="relative max-w-lg text-white">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <Wallet size={34} />
          </div>

          <h2 className="text-4xl font-bold leading-tight">
            Make every shilling count.
          </h2>

          <p className="mt-5 text-lg leading-8 text-emerald-100/80">
            Understand your spending, set meaningful budgets, and take control
            of your financial future, one decision at a time.
          </p>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm leading-6 text-emerald-50">
              â€œA clearer picture of your money starts with a single step.â€
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-emerald-300">
              Your financial journey starts here
            </p>
          </div>
        </div>
      </aside>
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
