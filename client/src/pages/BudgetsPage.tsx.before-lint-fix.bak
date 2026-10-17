
import { useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  saveBudget,
  deleteBudget,
} from '../features/budget/budgetSlice'

function getCurrentMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatMonth(month: string) {
  if (!month) return ''

  const [year, monthNumber] = month.split('-').map(Number)

  return new Date(year, monthNumber - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

export default function BudgetsPage() {
  const dispatch = useAppDispatch()

  const expenses = useAppSelector((state) => state.expenses.items)
  const budgets = useAppSelector((state) => state.budgets.items)

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [budgetInput, setBudgetInput] = useState('')

  const monthlyBudget = budgets.find(
    (budget) => budget.month === selectedMonth,
  )

  const budgetLimit = monthlyBudget?.limit ?? 0

  const monthlyExpenses = expenses.filter(
    (expense) => expense.date.startsWith(selectedMonth),
  )

  const totalSpent = monthlyExpenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  )

  const remaining = budgetLimit - totalSpent

  const spendingPercentage =
    budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0

  const progressPercentage = Math.min(spendingPercentage, 100)

  function handleSaveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const limit = Number(budgetInput)

    if (!selectedMonth || !Number.isFinite(limit) || limit <= 0) {
      return
    }

    const now = new Date().toISOString()

    dispatch(
      saveBudget({
        id: monthlyBudget?.id ?? `${selectedMonth}-${Date.now()}`,
        month: selectedMonth,
        limit,
        createdAt: monthlyBudget?.createdAt ?? now,
        updatedAt: now,
      }),
    )

    setBudgetInput('')
  }

  function handleDeleteBudget() {
    if (!monthlyBudget) return

    const confirmed = window.confirm(
      `Remove the budget for ${formatMonth(selectedMonth)}?`,
    )

    if (confirmed) {
      dispatch(deleteBudget(selectedMonth))
      setBudgetInput('')
    }
  }

  const hasBudget = Boolean(monthlyBudget)

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Monthly budget
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Set a spending limit and track your expenses throughout the month.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block max-w-xs text-sm font-medium text-slate-700">
          Select month
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              setSelectedMonth(event.target.value)
              setBudgetInput('')
            }}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Monthly budget
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(budgetLimit)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {hasBudget ? 'Budget set for this month' : 'No budget set yet'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Total spent
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(totalSpent)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {monthlyExpenses.length} expense
            {monthlyExpenses.length === 1 ? '' : 's'} in{' '}
            {formatMonth(selectedMonth)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            {remaining < 0 ? 'Amount over budget' : 'Budget remaining'}
          </p>
          <p
            className={`mt-3 text-2xl font-bold ${
              remaining < 0
                ? 'text-red-600'
                : 'text-emerald-600'
            }`}
          >
            {formatCurrency(Math.abs(remaining))}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {remaining < 0
              ? 'You have exceeded your spending limit.'
              : 'Available to spend this month.'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Spending progress
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {formatMonth(selectedMonth)}
            </p>
          </div>

          {hasBudget && (
            <span
              className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                remaining < 0
                  ? 'bg-red-50 text-red-700'
                  : spendingPercentage >= 80
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {remaining < 0
                ? 'Over budget'
                : spendingPercentage >= 80
                  ? 'Near budget limit'
                  : 'Within budget'}
            </span>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between gap-4 text-sm">
            <span className="text-slate-600">
              {hasBudget
                ? `${Math.round(spendingPercentage)}% used`
                : 'Set a budget to track your progress'}
            </span>
            <span className="font-medium text-slate-700">
              {formatCurrency(totalSpent)}
              {hasBudget ? ` / ${formatCurrency(budgetLimit)}` : ''}
            </span>
          </div>

          <div
            className="h-3 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Monthly budget spending progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(
              Math.round(spendingPercentage),
              100,
            )}
          >
            <div
              className={`h-full rounded-full transition-all ${
                remaining < 0
                  ? 'bg-red-500'
                  : spendingPercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">
          {hasBudget ? 'Update monthly budget' : 'Set monthly budget'}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Choose the maximum amount you plan to spend in{' '}
          {formatMonth(selectedMonth)}.
        </p>

        <form
          onSubmit={handleSaveBudget}
          className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="block flex-1 text-sm font-medium text-slate-700">
            Budget limit (RWF)
            <input
              required
              type="number"
              min="1"
              step="1"
              value={budgetInput}
              onChange={(event) => setBudgetInput(event.target.value)}
              placeholder={
                hasBudget ? String(budgetLimit) : 'e.g. 200000'
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {hasBudget ? 'Update budget' : 'Save budget'}
          </button>

          {hasBudget && (
            <button
              type="button"
              onClick={handleDeleteBudget}
              className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Remove budget
            </button>
          )}
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">
            Expenses for {formatMonth(selectedMonth)}
          </h3>
        </div>

        {monthlyExpenses.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            No expenses recorded for this month yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {monthlyExpenses
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {expense.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(expense.date)} · {expense.paymentMethod}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  )
}

function formatDate(date: string) {
  if (!date) return '—'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
