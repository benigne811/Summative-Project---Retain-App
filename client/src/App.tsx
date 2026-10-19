import { useEffect, useState, type FormEvent } from 'react'
import {
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Target,
  Wallet,
  X,
  ChartNoAxesCombined,
  ShieldCheck,
  UserPlus,
  Settings,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from './app/hooks'
import {
  addExpense,
  setExpenses,
} from './features/expenses/expenseSlice'
import { apiRequest } from './services/api'
import ExpensesPage from './pages/ExpensesPage'
import BudgetsPage from './pages/BudgetsPage'
import ReportsPage from './pages/ReportsPage'
import { useAuth } from './context/useAuth'
import type { Expense } from './types/expense'
import type { ExpenseCategory } from './types/expense'
import { setCategories } from './features/expenses/categorySlice'
import AdminPage from './pages/AdminPage'
import { setBudgets } from './features/budget/budgetSlice'
import type { MonthlyBudget } from './types/budget'
import SettingsPage from './pages/SettingsPage'
import { useCurrency } from './features/settings/useCurrency'

type ExpenseFormValues = {
  title: string
  amount: number
  date: string
  categoryId: string
  paymentMethod: Expense['paymentMethod']
}

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Expenses', icon: CreditCard },
  { label: 'Budgets', icon: Target },
  { label: 'Reports', icon: ChartNoAxesCombined },
  { label: 'Settings', icon: Settings },
]

function formatDate(date: string) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ExpenseForm({
  categories,
  onSubmit,
  onCancel,
}: {
  categories: ExpenseCategory[]
  onSubmit: (values: ExpenseFormValues) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [paymentMethod, setPaymentMethod] =
    useState<Expense['paymentMethod']>('Cash')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericAmount = Number(amount)

    if (
      !title.trim() ||
      !date ||
      !categoryId ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return
    }

    onSubmit({
      title: title.trim(),
      amount: numericAmount,
      date,
      categoryId,
      paymentMethod,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Expense title
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Groceries"
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Amount
          <input
            required
            min="1"
            step="1"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Date
          <input
            required
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Category
          <select
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Payment method
          <select
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(event.target.value as Expense['paymentMethod'])
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank transfer">Bank transfer</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Other">Other</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Save expense
        </button>
      </div>
    </form>
  )
}

function App() {
  const dispatch = useAppDispatch()
  const allExpenses = useAppSelector((state) => state.expenses.items)
  const categories = useAppSelector((state) => state.categories)
  const budgets = useAppSelector((state) => state.budgets.items)
  const { user, signOut, signIn, signUp } = useAuth()
  const { formatCurrency } = useCurrency()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseError, setExpenseError] = useState('')
  const [expensesLoading, setExpensesLoading] = useState(true)
  const [expensesLoadError, setExpensesLoadError] = useState('')
  const [dashboardMonth, setDashboardMonth] = useState(
    () => new Date().toISOString().slice(0, 7),
  )
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [accountMode, setAccountMode] = useState<'create' | 'switch'>('create')
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountEmail, setNewAccountEmail] = useState('')
  const [newAccountPassword, setNewAccountPassword] = useState('')
  const [accountError, setAccountError] = useState('')
  const [accountSuccess, setAccountSuccess] = useState('')
  const [accountSubmitting, setAccountSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiRequest<ExpenseCategory[]>('/api/categories')
      .then((loadedCategories) => {
        if (!cancelled) dispatch(setCategories(loadedCategories))
      })
      .catch(() => {
        // Keep the app usable if category loading fails; the page shows no categories.
      })
    return () => { cancelled = true }
  }, [dispatch, user?.id])

  useEffect(() => {
    let cancelled = false
    apiRequest<MonthlyBudget[]>('/api/budgets')
      .then((loadedBudgets) => {
        if (!cancelled) dispatch(setBudgets(loadedBudgets))
      })
      .catch(() => {
        // The Budgets page reports load errors if this background refresh fails.
      })
    return () => { cancelled = true }
  }, [dispatch, user?.id])

  useEffect(() => {
    let cancelled = false

    async function loadExpenses() {
      setExpensesLoading(true)

      try {
        const expenses = await apiRequest<Expense[]>('/api/expenses')

        if (!cancelled) {
          dispatch(setExpenses(expenses))
          setExpensesLoadError('')
        }
      } catch (error) {
        if (!cancelled) {
          setExpensesLoadError(
            error instanceof Error
              ? error.message
              : 'Could not load expenses. Please try again.',
          )
        }
      } finally {
        if (!cancelled) {
          setExpensesLoading(false)
        }
      }
    }

    void loadExpenses()

    return () => {
      cancelled = true
    }
  }, [dispatch, user?.id])

  const monthlyExpenses = allExpenses.filter((expense) =>
    expense.date.startsWith(dashboardMonth),
  )

  const spent = monthlyExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  )

  const currentBudget = budgets.find((item) => item.month === dashboardMonth)
  const budget = currentBudget?.limit ?? 0
  const hasBudget = budget > 0
  const remaining = hasBudget ? budget - spent : 0
  const budgetPercentage = hasBudget
    ? Math.min((spent / budget) * 100, 100)
    : 0

  const highestExpense = monthlyExpenses.reduce<Expense | undefined>(
    (highest, expense) =>
      !highest || expense.amount > highest.amount ? expense : highest,
    undefined,
  )

  const categorySpending = categories
    .map((category) => ({
      ...category,
      amount: monthlyExpenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((total, expense) => total + expense.amount, 0),
    }))
    .filter((category) => category.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4)

  const dashboardMonthLabel = new Date(`${dashboardMonth}-01T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const recentExpenses = monthlyExpenses.slice(0, 10)

  async function handleAddExpense(values: ExpenseFormValues) {
    setExpenseError('')

    try {
      const savedExpense = await apiRequest<Expense>('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(values),
      })

      dispatch(addExpense(savedExpense))
      setShowExpenseForm(false)
      setActivePage('Expenses')
    } catch (error) {
      setExpenseError(
        error instanceof Error
          ? error.message
          : 'Could not save the expense. Please try again.',
      )
    }
  }

  async function handleRetryLoadingExpenses() {
    setExpensesLoading(true)
    setExpensesLoadError('')

    try {
      const expenses = await apiRequest<Expense[]>('/api/expenses')
      dispatch(setExpenses(expenses))
    } catch (error) {
      setExpensesLoadError(
        error instanceof Error
          ? error.message
          : 'Could not load expenses. Please try again.',
      )
    } finally {
      setExpensesLoading(false)
    }
  }

  async function handleSignOut() {
    setProfileMenuOpen(false)
    setSidebarOpen(false)
    await signOut()
  }

  async function handleAddAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAccountError('')
    setAccountSuccess('')
    setAccountSubmitting(true)

    try {
      if (accountMode === 'create') {
        await signUp(newAccountName.trim(), newAccountEmail.trim(), newAccountPassword)
        setAccountMode('switch')
        setAccountSuccess('Account created. Sign in below to switch to it.')
      } else {
        await signIn(newAccountEmail.trim(), newAccountPassword)
        setShowAddAccount(false)
        setNewAccountEmail('')
        setNewAccountPassword('')
        window.location.reload()
      }
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Could not create this account.')
    } finally {
      setAccountSubmitting(false)
    }
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const displayName = user?.name?.trim() || 'My account'
  const firstName = displayName.split(/\s+/)[0]
  const userInitial = displayName.charAt(0).toUpperCase() || 'U'

  return (
    <div className="retain-app min-h-screen bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <button
            className="flex items-center gap-3"
            onClick={() => setActivePage('Dashboard')}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Wallet size={22} />
            </span>

            <span className="text-2xl font-bold tracking-tight text-slate-900">
              retain<span className="text-emerald-600">.</span>
            </span>
          </button>

          <button
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {[...navigation, ...(user?.role === 'admin' ? [{ label: 'Admin', icon: ShieldCheck }] : [])].map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {
                  setActivePage(label)
                  setSidebarOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  activePage === label
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={19} />
                {label}

                {label === 'Expenses' && (
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    {allExpenses.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-4 flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              aria-label="Open navigation"
              className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                {activePage}
              </h1>

            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"
                aria-label={`Open profile menu for ${displayName}`}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {userInitial}
                </span>

                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold text-slate-800">
                    {displayName}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {user?.email ?? 'Personal account'}
                  </span>
                </span>

                <ChevronDown
                  size={15}
                  className="hidden text-slate-400 sm:block"
                />
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Profile menu"
                  className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg"
                >
                  <div className="border-b border-slate-100 px-3 pb-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {displayName}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {user?.email}
                    </p>
                    <p className="mt-2 text-xs capitalize text-slate-500">
                      {user?.role} account
                    </p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false)
                      setAccountError('')
                      setAccountSuccess('')
                      setAccountMode('create')
                      setShowAddAccount(true)
                    }}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <UserPlus size={17} />
                    Add account
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void handleSignOut()}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <LogOut size={17} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {expensesLoading && (
          <p className="px-4 pt-4 text-sm text-slate-500 sm:px-8">
            Loading your expenses...
          </p>
        )}

        {expensesLoadError && (
          <div
            role="alert"
            className="mx-4 mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:mx-8"
          >
            <p>{expensesLoadError}</p>
            <button
              type="button"
              onClick={() => void handleRetryLoadingExpenses()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {activePage === 'Expenses' ? (
          <div className="mx-auto max-w-7xl p-4 sm:p-8">
            <ExpensesPage />
          </div>
        ) : activePage === 'Budgets' ? (
          <div className="mx-auto max-w-7xl p-4 sm:p-8">
            <BudgetsPage />
          </div>
        ) : activePage === 'Reports' ? (
          <div className="mx-auto max-w-7xl p-4 sm:p-8">
            <ReportsPage />
          </div>
        ) : activePage === 'Admin' && user?.role === 'admin' ? (
          <div className="mx-auto max-w-7xl p-4 sm:p-8">
            <AdminPage />
          </div>
        ) : activePage === 'Settings' ? (
          <div className="mx-auto max-w-7xl p-4 sm:p-8">
            <SettingsPage />
          </div>
        ) : activePage === 'Dashboard' ? (
          <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-emerald-700">{today}</p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Welcome, {firstName}.
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="text-xs font-semibold text-slate-500">
                  Dashboard month
                  <input
                    aria-label="Select dashboard month"
                    type="month"
                    value={dashboardMonth}
                    onChange={(event) => {
                      if (event.target.value) setDashboardMonth(event.target.value)
                    }}
                    className="mt-1 block min-h-12 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
                  />
                </label>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Plus size={18} />
                  Add expense
                </button>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Total spent
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(spent)}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {dashboardMonthLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Remaining budget
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {hasBudget ? formatCurrency(remaining) : 'Not set'}
                </p>

                {hasBudget ? (
                  <>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          remaining < 0 ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${budgetPercentage}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {Math.round(budgetPercentage)}% of your monthly budget used
                    </p>
                  </>
                ) : (
                  <button
                    onClick={() => setActivePage('Budgets')}
                    className="mt-3 text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Set a monthly budget →
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Highest expense
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(highestExpense?.amount ?? 0)}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {highestExpense?.title ?? `No expenses recorded in ${dashboardMonthLabel}`}
                </p>
              </div>
            </section>

            <section>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="font-bold text-slate-900">
                  Spending by category
                </h3>

                <div className="mt-6 space-y-6">
                  {categorySpending.length > 0 ? (
                    categorySpending.map((category) => (
                      <div key={category.id}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-600">
                            {category.name}
                          </span>

                          <span className="text-sm font-semibold text-slate-800">
                            {formatCurrency(category.amount)}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${Math.min(
                                (category.amount /
                                  Math.max(
                                    ...categorySpending.map(
                                      (item) => item.amount,
                                    ),
                                  )) *
                                  100,
                                100,
                              )}%`,
                              backgroundColor: category.color,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Add an expense to see your category breakdown.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
                <div>
                  <h3 className="font-bold text-slate-900">Recent expenses</h3>
                </div>

                <button
                  onClick={() => setActivePage('Expenses')}
                  className="text-left text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View all expenses →
                </button>
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[680px] text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-6 py-4">Expense</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Payment method</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentExpenses.map((expense) => {
                      const category = categories.find(
                        (item) => item.id === expense.categoryId,
                      )

                      return (
                        <tr
                          key={expense.id}
                          className="hover:bg-slate-50/70"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {expense.title}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {category?.name ?? 'Uncategorized'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {formatDate(expense.date)}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {expense.paymentMethod}
                          </td>

                          <td className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                            {formatCurrency(expense.amount)}
                          </td>
                        </tr>
                      )
                    })}

                    {recentExpenses.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-sm text-slate-500"
                        >
                          No expenses for {dashboardMonthLabel}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 sm:hidden">
                {recentExpenses.map((expense) => {
                  const category = categories.find(
                    (item) => item.id === expense.categoryId,
                  )

                  return (
                    <article key={expense.id} className="flex items-start justify-between gap-3 p-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-800">
                            {expense.title}
                          </p>
                          <p className="mt-1 break-words text-xs text-slate-500">
                            {category?.name ?? 'Uncategorized'} · {formatDate(expense.date)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {expense.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {formatCurrency(expense.amount)}
                      </p>
                    </article>
                  )
                })}

                {recentExpenses.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-slate-500">
                    No expenses for {dashboardMonthLabel}.
                  </p>
                )}
              </div>

            </section>
          </div>
        ) : (
          <div className="mx-auto max-w-7xl p-4 sm:p-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                {activePage}
              </h2>

              <button
                onClick={() => setActivePage('Dashboard')}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {showExpenseForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowExpenseForm(false)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-dialog-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2
                  id="expense-dialog-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Add an expense
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the details of your transaction.
                </p>
              </div>

              <button
                aria-label="Close expense form"
                onClick={() => setShowExpenseForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {expenseError && (
              <p
                role="alert"
                className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {expenseError}
              </p>
            )}

            <ExpenseForm
              categories={categories}
              onSubmit={handleAddExpense}
              onCancel={() => setShowExpenseForm(false)}
            />
          </div>
        </div>
      )}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="add-account-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="add-account-title" className="text-xl font-bold text-slate-900">Add account</h2>
                <p className="mt-1 text-sm text-slate-500">Create an account or switch to one you already have.</p>
              </div>
              <button type="button" aria-label="Close add account form" onClick={() => setShowAddAccount(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button type="button" aria-pressed={accountMode === 'create'} onClick={() => { setAccountMode('create'); setAccountError('') }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${accountMode === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Create account</button>
              <button type="button" aria-pressed={accountMode === 'switch'} onClick={() => { setAccountMode('switch'); setAccountError('') }} className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${accountMode === 'switch' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Switch account</button>
            </div>
            {accountError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{accountError}</p>}
            {accountSuccess && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{accountSuccess}</p>}
            <form onSubmit={(event) => void handleAddAccount(event)} className="space-y-4">
              {accountMode === 'create' && <label className="block text-sm font-medium text-slate-700">Full name<input required autoComplete="name" value={newAccountName} onChange={(event) => setNewAccountName(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500" /></label>}
              <label className="block text-sm font-medium text-slate-700">Email address<input required type="email" autoComplete="email" value={newAccountEmail} onChange={(event) => setNewAccountEmail(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500" /></label>
              <label className="block text-sm font-medium text-slate-700">Password<input required minLength={accountMode === 'create' ? 8 : undefined} type="password" autoComplete={accountMode === 'create' ? 'new-password' : 'current-password'} value={newAccountPassword} onChange={(event) => setNewAccountPassword(event.target.value)} className="mt-1 min-h-12 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-emerald-500" /></label>
              <button type="submit" disabled={accountSubmitting} className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{accountSubmitting ? (accountMode === 'create' ? 'Creating account…' : 'Switching account…') : (accountMode === 'create' ? 'Create account' : 'Sign in and switch')}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
