
import { useMemo, useState } from 'react'
import { CalendarDays, ChartNoAxesCombined, Receipt, Wallet } from 'lucide-react'
import { useAppSelector } from '../app/hooks'
import type { Expense } from '../types/expense'

const categories = [
  { id: 'food', name: 'Food & Dining', color: '#10b981' },
  { id: 'transport', name: 'Transport', color: '#3b82f6' },
  { id: 'housing', name: 'Housing', color: '#f97316' },
  { id: 'shopping', name: 'Shopping', color: '#8b5cf6' },
  { id: 'bills', name: 'Bills & Utilities', color: '#eab308' },
  { id: 'health', name: 'Health', color: '#ef4444' },
  { id: 'entertainment', name: 'Entertainment', color: '#ec4899' },
  { id: 'other', name: 'Other', color: '#64748b' },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function ReportsPage() {
  const expenses = useAppSelector((state) => state.expenses.items)
  const budgets = useAppSelector((state) => state.budgets.items)

  const currentMonth = new Date().toISOString().slice(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const availableMonths = useMemo(() => {
    const months = new Set<string>([currentMonth])

    expenses.forEach((expense) => {
      if (/^\d{4}-\d{2}/.test(expense.date)) {
        months.add(expense.date.slice(0, 7))
      }
    })

    budgets.forEach((budget) => {
      if (/^\d{4}-\d{2}$/.test(budget.month)) {
        months.add(budget.month)
      }
    })

    return [...months].sort((a, b) => b.localeCompare(a))
  }, [expenses, budgets, currentMonth])

  const monthlyExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.date.startsWith(selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, selectedMonth],
  )

  const totalSpent = monthlyExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  )

  const transactionCount = monthlyExpenses.length

  const averageExpense =
    transactionCount > 0 ? totalSpent / transactionCount : 0

  const monthlyBudget = budgets.find(
    (budget) => budget.month === selectedMonth,
  )?.limit ?? 0

  const remainingBudget = monthlyBudget - totalSpent

  const categorySpending = categories
    .map((category) => ({
      ...category,
      amount: monthlyExpenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((total, expense) => total + expense.amount, 0),
    }))
    .filter((category) => category.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const highestCategory = categorySpending[0]
  const highestExpense = monthlyExpenses.reduce<Expense | undefined>(
    (highest, expense) =>
      !highest || expense.amount > highest.amount ? expense : highest,
    undefined,
  )

  const budgetPercentage =
    monthlyBudget > 0
      ? Math.round((totalSpent / monthlyBudget) * 100)
      : 0

  const monthLabel = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString(
    'en-US',
    { month: 'long', year: 'numeric' },
  )

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Your financial overview
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Spending reports
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Understand your spending and make informed financial decisions.
          </p>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <CalendarDays size={18} className="text-emerald-600" />
          <span className="font-medium text-slate-600">Reporting month</span>
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="max-w-40 bg-transparent font-semibold text-slate-900 outline-none"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total spent"
          value={formatCurrency(totalSpent)}
          detail={monthLabel}
          icon={<Wallet size={20} />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          label="Transactions"
          value={String(transactionCount)}
          detail="Recorded expenses"
          icon={<Receipt size={20} />}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          label="Average expense"
          value={formatCurrency(averageExpense)}
          detail="Per transaction"
          icon={<ChartNoAxesCombined size={20} />}
          iconClass="bg-violet-50 text-violet-600"
        />

        <SummaryCard
          label="Budget remaining"
          value={
            monthlyBudget > 0
              ? formatCurrency(remainingBudget)
              : 'Not set'
          }
          detail={
            monthlyBudget > 0
              ? `${budgetPercentage}% of budget used`
              : 'Set a budget to track progress'
          }
          icon={<CalendarDays size={20} />}
          iconClass={
            monthlyBudget > 0 && remainingBudget < 0
              ? 'bg-red-50 text-red-600'
              : 'bg-orange-50 text-orange-600'
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-3">
          <h3 className="font-bold text-slate-900">Spending by category</h3>
          <p className="mt-1 text-sm text-slate-500">
            See which categories account for your spending in {monthLabel}.
          </p>

          {categorySpending.length > 0 ? (
            <div className="mt-7 space-y-6">
              {categorySpending.map((category) => (
                <div key={category.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">
                      {category.name}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>

                  <div
                    className="h-3 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${category.name} spending`}
                    aria-valuemin={0}
                    aria-valuemax={totalSpent}
                    aria-valuenow={category.amount}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(category.amount / totalSpent) * 100}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {totalSpent > 0
                      ? `${((category.amount / totalSpent) * 100).toFixed(1)}% of total spending`
                      : '0% of total spending'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No category spending to report for this month. Add an expense to get started." />
          )}
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-bold text-slate-900">Budget performance</h3>
            <p className="mt-1 text-sm text-slate-500">
              Spending compared with your monthly limit.
            </p>

            {monthlyBudget > 0 ? (
              <>
                <p className="mt-6 text-2xl font-bold text-slate-900">
                  {formatCurrency(totalSpent)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  of {formatCurrency(monthlyBudget)} budget
                </p>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      totalSpent > monthlyBudget
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(budgetPercentage, 100)}%`,
                    }}
                  />
                </div>

                <p
                  className={`mt-3 text-sm font-medium ${
                    remainingBudget < 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {remainingBudget < 0
                    ? `${formatCurrency(Math.abs(remainingBudget))} over budget`
                    : `${formatCurrency(remainingBudget)} remaining`}
                </p>
              </>
            ) : (
              <EmptyState message="No budget has been set for this month. Visit Budgets to create one." />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-bold text-slate-900">Highlights</h3>
            <div className="mt-4 space-y-4">
              <Highlight
                label="Highest expense"
                value={
                  highestExpense
                    ? `${highestExpense.title} · ${formatCurrency(highestExpense.amount)}`
                    : 'No expenses recorded'
                }
              />
              <Highlight
                label="Top spending category"
                value={
                  highestCategory
                    ? `${highestCategory.name} · ${formatCurrency(highestCategory.amount)}`
                    : 'No category spending yet'
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">Transactions for {monthLabel}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'} included in this report.
          </p>
        </div>

        {monthlyExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-4">Expense</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyExpenses.map((expense) => {
                  const category = categories.find(
                    (item) => item.id === expense.categoryId,
                  )

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        {expense.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {category?.name ?? 'Uncategorized'}
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
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="There are no expenses for this reporting month." />
        )}
      </section>

      <footer className="pb-2 text-center text-xs text-slate-400">
        Retain © 2026 · Make every shilling count.
      </footer>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
  iconClass,
}: {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
  iconClass: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`rounded-xl p-2.5 ${iconClass}`}>{icon}</span>
      </div>
      <p className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  )
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-emerald-500 pl-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm leading-6 text-slate-500">{message}</p>
  )
}

export default ReportsPage
