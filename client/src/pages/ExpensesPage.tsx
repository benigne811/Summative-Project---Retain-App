
import { useState, type FormEvent } from 'react'
import { Pencil, Search, Trash2, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  deleteExpense,
  updateExpense,
  setSearch,
  setCategoryFilter,
  setPaymentMethodFilter,
  setDateRange,
  setAmountRange,
  setSorting,
  setCurrentPage,
  setPageSize,
} from '../features/expenses/expenseSlice'
import { apiRequest } from '../services/api'
import { useExpenses } from '../features/expenses/useExpenses'
import type { Expense, PaymentMethod } from '../types/expense'

const paymentMethods: PaymentMethod[] = [
  'Cash',
  'Mobile Money',
  'Bank transfer',
  'Card',
  'Other',
]

type ExpenseFormValues = {
  title: string
  amount: number
  date: string
  categoryId: string
  paymentMethod: PaymentMethod
  description?: string
  notes?: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string) {
  if (!date) return '—'

  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )
}

function ExpenseEditor({
  expense,
  saving,
  error,
  onSave,
  onCancel,
}: {
  expense: Expense
  saving: boolean
  error: string
  onSave: (values: ExpenseFormValues) => Promise<void>
  onCancel: () => void
}) {
  const categories = useAppSelector((state) => state.categories)
  const [title, setTitle] = useState(expense.title)
  const [amount, setAmount] = useState(String(expense.amount))
  const [date, setDate] = useState(expense.date.slice(0, 10))
  const [categoryId, setCategoryId] = useState(expense.categoryId)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    expense.paymentMethod,
  )
  const [description, setDescription] = useState(expense.description ?? '')
  const [notes, setNotes] = useState(expense.notes ?? '')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    await onSave({
      title: title.trim(),
      amount: numericAmount,
      date,
      categoryId,
      paymentMethod,
      description: description.trim(),
      notes: notes.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-expense-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2
              id="edit-expense-title"
              className="text-xl font-bold text-slate-900"
            >
              Edit expense
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update the details of this transaction.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close edit form"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Expense title
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Amount (RWF)
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
                  setPaymentMethod(event.target.value as PaymentMethod)
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Description (optional)
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Notes (optional)
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
            />
          </label>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  const dispatch = useAppDispatch()
  const categories = useAppSelector((state) => state.categories)
  const filters = useAppSelector((state) => state.expenses.filters)
  const { filteredExpenses, paginatedExpenses, pagination } = useExpenses()

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pageError, setPageError] = useState('')
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null)

  const { currentPage, totalPages, startItem, endItem } = pagination

  async function handleSaveExpense(values: ExpenseFormValues) {
    if (!editingExpense) return

    setSaving(true)
    setEditError('')
    setPageError('')

    try {
      const savedExpense = await apiRequest<Expense>(
        `/api/expenses/${encodeURIComponent(editingExpense.id)}`,
        {
          method: 'PUT',
          body: JSON.stringify(values),
        },
      )

      dispatch(updateExpense(savedExpense))
      setEditingExpense(null)
    } catch (error) {
      setEditError(
        error instanceof Error
          ? error.message
          : 'Could not update this expense. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteExpense(expense: Expense) {
    const confirmed = window.confirm(
      `Delete "${expense.title}"? This action cannot be undone.`,
    )

    if (!confirmed) return

    setBusyDeleteId(expense.id)
    setPageError('')

    try {
      await apiRequest<void>(
        `/api/expenses/${encodeURIComponent(expense.id)}`,
        { method: 'DELETE' },
      )

      dispatch(deleteExpense(expense.id))
      setDeletingId(null)
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : 'Could not delete this expense. Please try again.',
      )
    } finally {
      setBusyDeleteId(null)
    }
  }

  function resetFilters() {
    dispatch(setSearch(''))
    dispatch(setCategoryFilter('all'))
    dispatch(setPaymentMethodFilter('all'))
    dispatch(setDateRange({ startDate: '', endDate: '' }))
    dispatch(setAmountRange({ minAmount: '', maxAmount: '' }))
    dispatch(setCurrentPage(1))
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Your expenses
          </h2>
        </div>

        <p className="text-sm text-slate-500">
          {filteredExpenses.length} expense
          {filteredExpenses.length === 1 ? '' : 's'}
        </p>
      </section>

      {pageError && (
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {pageError}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <Search
              size={17}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              value={filters.search}
              onChange={(event) => dispatch(setSearch(event.target.value))}
              placeholder="Title, category, date, amount..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
            />
          </label>

          <select
            aria-label="Filter by category"
            value={filters.categoryId}
            onChange={(event) =>
              dispatch(setCategoryFilter(event.target.value))
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by payment method"
            value={filters.paymentMethod}
            onChange={(event) =>
              dispatch(setPaymentMethodFilter(event.target.value))
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="all">All payment methods</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-medium text-slate-500">
            From date
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                dispatch(
                  setDateRange({
                    startDate: event.target.value,
                    endDate: filters.endDate,
                  }),
                )
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="text-xs font-medium text-slate-500">
            To date
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                dispatch(
                  setDateRange({
                    startDate: filters.startDate,
                    endDate: event.target.value,
                  }),
                )
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="text-xs font-medium text-slate-500">
            Minimum amount
            <input
              type="number"
              min="0"
              value={filters.minAmount}
              onChange={(event) =>
                dispatch(
                  setAmountRange({
                    minAmount: event.target.value,
                    maxAmount: filters.maxAmount,
                  }),
                )
              }
              placeholder="No minimum"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="text-xs font-medium text-slate-500">
            Maximum amount
            <input
              type="number"
              min="0"
              value={filters.maxAmount}
              onChange={(event) =>
                dispatch(
                  setAmountRange({
                    minAmount: filters.minAmount,
                    maxAmount: event.target.value,
                  }),
                )
              }
              placeholder="No maximum"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-bold text-slate-900">All expenses</h3>
            <p className="mt-1 text-sm text-slate-500">
              Select an expense to edit or delete it.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500" htmlFor="expense-sort">
              Sort by
            </label>
            <select
              id="expense-sort"
              value={`${filters.sortBy}-${filters.sortDirection}`}
              onChange={(event) => {
                const [sortBy, sortDirection] = event.target.value.split('-')
                dispatch(
                  setSorting({
                    sortBy: sortBy as 'date' | 'amount' | 'title',
                    sortDirection: sortDirection as 'asc' | 'desc',
                  }),
                )
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-emerald-500"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-desc">Amount: high to low</option>
              <option value="amount-asc">Amount: low to high</option>
              <option value="title-asc">Title: A to Z</option>
              <option value="title-desc">Title: Z to A</option>
            </select>
          </div>
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-4">Expense</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedExpenses.map((expense) => {
                const category = categories.find(
                  (item) => item.id === expense.categoryId,
                )

                return (
                  <tr key={expense.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {expense.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {category?.name ?? 'Uncategorized'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(expense.date)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {expense.paymentMethod}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          aria-label={`Edit ${expense.title}`}
                          onClick={() => {
                            setEditError('')
                            setEditingExpense(expense)
                          }}
                          disabled={busyDeleteId === expense.id}
                          className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${expense.title}`}
                          onClick={() => setDeletingId(expense.id)}
                          disabled={
                            busyDeleteId === expense.id ||
                            deletingId === expense.id
                          }
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      {deletingId === expense.id && (
                        <div className="mt-2 min-w-44 rounded-lg border border-red-100 bg-red-50 p-3">
                          <p className="text-xs text-red-800">
                            Delete this expense permanently?
                          </p>
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              disabled={busyDeleteId === expense.id}
                              className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteExpense(expense)}
                              disabled={busyDeleteId === expense.id}
                              className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {busyDeleteId === expense.id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}

              {paginatedExpenses.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No expenses match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 sm:hidden">
          {paginatedExpenses.map((expense) => {
            const category = categories.find(
              (item) => item.id === expense.categoryId,
            )

            return (
              <article key={expense.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words text-sm font-semibold text-slate-900">
                      {expense.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {category?.name ?? 'Uncategorized'} · {formatDate(expense.date)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-slate-900">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="truncate text-xs text-slate-500">
                    {expense.paymentMethod}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      aria-label={`Edit ${expense.title}`}
                      onClick={() => {
                        setEditError('')
                        setEditingExpense(expense)
                      }}
                      disabled={busyDeleteId === expense.id}
                      className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                    >
                      <Pencil size={15} /> Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${expense.title}`}
                      onClick={() => setDeletingId(expense.id)}
                      disabled={
                        busyDeleteId === expense.id || deletingId === expense.id
                      }
                      className="flex min-h-11 items-center gap-2 rounded-lg border border-red-100 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>

                {deletingId === expense.id && (
                  <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
                    <p className="text-xs text-red-800">
                      Delete this expense permanently?
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        disabled={busyDeleteId === expense.id}
                        className="min-h-10 rounded-lg px-3 text-xs text-slate-600 hover:bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteExpense(expense)}
                        disabled={busyDeleteId === expense.id}
                        className="min-h-10 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {busyDeleteId === expense.id ? 'Deleting...' : 'Confirm delete'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}

          {paginatedExpenses.length === 0 && (
            <p className="px-4 py-12 text-center text-sm text-slate-500">
              No expenses match your filters.
            </p>
          )}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500">
              {filteredExpenses.length === 0
                ? 'Showing 0 expenses'
                : `Showing ${startItem}–${endItem} of ${filteredExpenses.length}`}
            </p>

            <select
              aria-label="Expenses per page"
              value={filters.pageSize}
              onChange={(event) => dispatch(setPageSize(Number(event.target.value)))}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(setCurrentPage(currentPage - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => dispatch(setCurrentPage(currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {editingExpense && (
        <ExpenseEditor
          key={editingExpense.id}
          expense={editingExpense}
          saving={saving}
          error={editError}
          onSave={handleSaveExpense}
          onCancel={() => {
            if (!saving) {
              setEditingExpense(null)
              setEditError('')
            }
          }}
        />
      )}
    </div>
  )
}
