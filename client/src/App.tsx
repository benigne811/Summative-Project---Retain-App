
import { useState, type FormEvent } from 'react'
import {
  ArrowDownLeft,
  Bell,
  CalendarDays,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  Target,
  TrendingUp,
  Wallet,
  X,
  ChartNoAxesCombined,
  CircleHelp,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { addExpense, setSearch } from './features/expenses/expenseSlice'
import { apiRequest } from './services/api'
import { useExpenses } from './features/expenses/useExpenses'
import ExpensesPage from './pages/ExpensesPage'
import BudgetsPage from './pages/BudgetsPage'
import ReportsPage from './pages/ReportsPage'
import { useAuth } from './context/useAuth'
import type { Expense } from './types/expense'

type Category = {
  id: string
  name: string
  color?: string
}

const categories: Category[] = [
  { id: 'food', name: 'Food & Dining', color: '#10b981' },
  { id: 'transport', name: 'Transport', color: '#3b82f6' },
  { id: 'housing', name: 'Housing', color: '#f97316' },
  { id: 'shopping', name: 'Shopping', color: '#8b5cf6' },
  { id: 'bills', name: 'Bills & Utilities', color: '#eab308' },
  { id: 'health', name: 'Health', color: '#ef4444' },
  { id: 'entertainment', name: 'Entertainment', color: '#ec4899' },
  { id: 'other', name: 'Other', color: '#64748b' },
]

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
]

const secondaryNavigation = [
  { label: 'Settings', icon: Settings },
  { label: 'Help & Support', icon: CircleHelp },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string) {
  if (!date) return 'â€”'

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
  categories: Category[]
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
  const searchQuery = useAppSelector((state) => state.expenses.filters.search)
  const budgets = useAppSelector((state) => state.budgets.items)
  const { filteredExpenses } = useExpenses()
  const { user, signOut } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseError, setExpenseError] = useState('')

  const currentMonth = new Date().toISOString().slice(0, 7)

  const monthlyExpenses = allExpenses.filter((expense) =>
    expense.date.startsWith(currentMonth),
  )

  const spent = monthlyExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  )

  const currentBudget = budgets.find(
    (item) => item.month === currentMonth,
  )
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
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
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
            {navigation.map(({ label, icon: Icon }) => (
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

        <div className="mt-8 px-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Preferences
          </p>

          <nav className="space-y-1">
            {secondaryNavigation.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => {
                  setActivePage(label)
                  setSidebarOpen(false)
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                  activePage === label
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon size={19} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-slate-900 p-4 text-white">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <Target size={19} />
            </div>

            <p className="font-semibold">Stay on track</p>

            <p className="mt-1 text-xs leading-5 text-slate-300">
              Small steps today lead to better financial habits tomorrow.
            </p>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-300">
              {hasBudget
                ? `${Math.round(budgetPercentage)}% of budget used`
                : 'No monthly budget set'}
            </p>

            <button
              type="button"
              onClick={() => {
                setActivePage('Budgets')
                setSidebarOpen(false)
              }}
              className="mt-3 text-xs font-semibold text-emerald-300 hover:text-white"
            >
              Manage budget â†’
            </button>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50 hover:text-red-600"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                {activePage}
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Your money, thoughtfully managed.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
              <Search size={17} className="text-slate-400" />

              <input
                value={searchQuery}
                onChange={(event) => dispatch(setSearch(event.target.value))}
                placeholder="Search expenses..."
                className="w-36 bg-transparent text-sm outline-none placeholder:text-slate-400 lg:w-48"
              />
            </label>

            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
            >
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>

            <button
              type="button"
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"
              aria-label={`Signed in as ${displayName}`}
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
          </div>
        </header>

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
        ) : activePage === 'Dashboard' ? (
          <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-emerald-700">{today}</p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Welcome back, {firstName}!
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Here is an overview of your finances this month.
                </p>
              </div>

              <button
                onClick={() => setShowExpenseForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Plus size={18} />
                Add expense
              </button>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Total spent
                  </span>
                  <span className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <Wallet size={20} />
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(spent)}
                </p>

                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <CalendarDays size={14} />
                  {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Remaining budget
                  </span>
                  <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <Target size={20} />
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
                    Set a monthly budget â†’
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">
                    Highest expense
                  </span>
                  <span className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                    <TrendingUp size={20} />
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {formatCurrency(highestExpense?.amount ?? 0)}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {highestExpense?.title ?? 'No expenses recorded this month'}
                </p>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3 sm:p-6">
                <h3 className="font-bold text-slate-900">Monthly spending</h3>

                <p className="mt-1 text-sm text-slate-500">
                  Keep an eye on your monthly budget.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Spent so far</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatCurrency(spent)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Monthly limit</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {hasBudget ? formatCurrency(budget) : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      remaining < 0 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${budgetPercentage}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {hasBudget
                      ? `${Math.round(budgetPercentage)}% used`
                      : 'No budget set'}
                  </span>
                  <span>
                    {hasBudget ? (
                      `${formatCurrency(remaining)} left`
                    ) : (
                      <button
                        onClick={() => setActivePage('Budgets')}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Set budget
                      </button>
                    )}
                  </span>
                </div>

                <div className="mt-8 rounded-xl bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="rounded-lg bg-white p-2 text-emerald-600">
                      <ArrowDownLeft size={18} />
                    </span>

                    <div>
                      <p className="text-sm font-semibold text-emerald-900">
                        {!hasBudget
                          ? 'Create your monthly budget'
                          : remaining >= 0
                            ? "You're within your budget!"
                            : "You've exceeded your budget."}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-emerald-800">
                        {!hasBudget
                          ? 'Set a spending limit to track how much you have left each month.'
                          : remaining >= 0
                            ? `You still have ${formatCurrency(remaining)} available this month.`
                            : `You're ${formatCurrency(Math.abs(remaining))} over your monthly limit.`}
                      </p>

                      {!hasBudget && (
                        <button
                          onClick={() => setActivePage('Budgets')}
                          className="mt-2 text-xs font-semibold text-emerald-800 underline"
                        >
                          Set monthly budget
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6">
                <h3 className="font-bold text-slate-900">
                  Spending by category
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Where your money goes.
                </p>

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

                  <p className="mt-1 text-sm text-slate-500">
                    Your recorded transactions.
                  </p>
                </div>

                <button
                  onClick={() => setActivePage('Expenses')}
                  className="text-left text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  View all expenses â†’
                </button>
              </div>

              <div className="overflow-x-auto">
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
                    {filteredExpenses.slice(0, 10).map((expense) => {
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
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <ShoppingBag size={19} />
                              </span>

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

                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-sm text-slate-500"
                        >
                          {searchQuery
                            ? 'No expenses match your search.'
                            : 'No expenses yet. Select Add expense to record your first transaction.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-xs text-slate-500">
                  Showing {Math.min(filteredExpenses.length, 10)} of{' '}
                  {filteredExpenses.length} matching expenses
                </p>

                <button
                  onClick={() => dispatch(setSearch(''))}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Clear search
                </button>
              </div>
            </section>

            <footer className="pb-2 text-center text-xs text-slate-400">
              Retain Â© 2026 Â· Make every shilling count.
            </footer>
          </div>
        ) : (
          <div className="mx-auto max-w-7xl p-4 sm:p-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                {activePage}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                This section is not available yet. We'll build it next.
              </p>

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
    </div>
  )
}

export default App
