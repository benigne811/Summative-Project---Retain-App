import {
  ArrowDownLeft,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
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
} from 'lucide-react'
import { useState } from 'react'

const expenses = [
  {
    id: 1,
    title: 'Grocery shopping',
    category: 'Food & Groceries',
    date: 'Oct 13, 2026',
    payment: 'Mobile Money',
    amount: 28500,
    icon: ShoppingBag,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 2,
    title: 'Monthly internet',
    category: 'Bills & Utilities',
    date: 'Oct 12, 2026',
    payment: 'Bank transfer',
    amount: 18000,
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 3,
    title: 'Lunch with friends',
    category: 'Food & Groceries',
    date: 'Oct 11, 2026',
    payment: 'Mobile Money',
    amount: 12500,
    icon: Wallet,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 4,
    title: 'Transport',
    category: 'Transportation',
    date: 'Oct 10, 2026',
    payment: 'Cash',
    amount: 6500,
    icon: CreditCard,
    color: 'bg-purple-100 text-purple-600',
  },
]

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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredExpenses = expenses.filter((expense) =>
    expense.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const spent = 385000
  const budget = 600000
  const remaining = budget - spent
  const budgetPercentage = (spent / budget) * 100

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
                    {expenses.length}
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
              {Math.round(budgetPercentage)}% of budget used
            </p>
          </div>

          <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50">
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
                onChange={(event) => setSearchQuery(event.target.value)}
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

            <button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                B
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold text-slate-800">
                  My account
                </span>
                <span className="block text-xs text-slate-500">Personal</span>
              </span>
              <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Tuesday, October 13, 2026
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back!
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Here is an overview of your finances this month.
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
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
                October 2026
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
                {formatCurrency(remaining)}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${budgetPercentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {Math.round(budgetPercentage)}% of your monthly budget used
              </p>
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
                {formatCurrency(45000)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Rent & accommodation
              </p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Monthly spending
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Keep an eye on your monthly budget.
                  </p>
                </div>
                <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                  October 2026
                </span>
              </div>

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
                    {formatCurrency(budget)}
                  </p>
                </div>
              </div>

              <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${budgetPercentage}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{Math.round(budgetPercentage)}% used</span>
                <span>{formatCurrency(remaining)} left</span>
              </div>

              <div className="mt-8 rounded-xl bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-white p-2 text-emerald-600">
                    <ArrowDownLeft size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">
                      You're within your budget!
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-800">
                      You still have {formatCurrency(remaining)} available for
                      the rest of the month.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6">
              <h3 className="font-bold text-slate-900">Spending by category</h3>
              <p className="mt-1 text-sm text-slate-500">
                Where your money goes.
              </p>

              <div className="mt-6 space-y-6">
                {[
                  { label: 'Food & groceries', amount: 120000, percent: 65, color: 'bg-emerald-500' },
                  { label: 'Bills & utilities', amount: 85000, percent: 45, color: 'bg-blue-500' },
                  { label: 'Transportation', amount: 60000, percent: 32, color: 'bg-orange-500' },
                  { label: 'Shopping', amount: 45000, percent: 24, color: 'bg-purple-500' },
                ].map((category) => (
                  <div key={category.label}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-600">
                        {category.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${category.color}`}
                        style={{ width: `${category.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h3 className="font-bold text-slate-900">Recent expenses</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your latest transactions.
                </p>
              </div>
              <button
                onClick={() => setActivePage('Expenses')}
                className="text-left text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View all expenses →
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
                  {filteredExpenses.map((expense) => {
                    const Icon = expense.icon

                    return (
                      <tr key={expense.id} className="hover:bg-slate-50/70">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${expense.color}`}
                            >
                              <Icon size={19} />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {expense.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {expense.category}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {expense.date}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {expense.payment}
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
                        No expenses match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <p className="text-xs text-slate-500">
                Showing {filteredExpenses.length} of {expenses.length} expenses
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Clear search
              </button>
            </div>
          </section>

          <footer className="pb-2 text-center text-xs text-slate-400">
            Retain © 2026 · Make every shilling count.
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
