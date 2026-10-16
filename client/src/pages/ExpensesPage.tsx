
import { useState, type FormEvent } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  setSearch,
  setCategoryFilter,
  setPaymentMethodFilter,
  setSorting,
  setCurrentPage,
  setPageSize,
  clearFilters,
  updateExpense,
  deleteExpense,
} from '../features/expenses/expenseSlice'
import {
  selectFilteredExpenses,
  selectPaginatedExpenses,
  selectPaginationInfo,
} from '../features/expenses/expenseSelectors'
import type { Expense, PaymentMethod } from '../types/expense'

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

const paymentMethods: PaymentMethod[] = [
  'Cash',
  'Mobile Money',
  'Bank transfer',
  'Card',
  'Other',
]

type ExpenseEditorProps = {
  expense: Expense
  categories: { id: string; name: string }[]
  onSave: (expense: Expense) => void
  onCancel: () => void
}

function ExpenseEditor({
  expense,
  categories,
  onSave,
  onCancel,
}: ExpenseEditorProps) {
  const [title, setTitle] = useState(expense.title)
  const [description, setDescription] = useState(expense.description ?? '')
  const [amount, setAmount] = useState(String(expense.amount))
  const [categoryId, setCategoryId] = useState(expense.categoryId)
  const [date, setDate] = useState(expense.date)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    expense.paymentMethod,
  )
  const [notes, setNotes] = useState(expense.notes ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const numericAmount = Number(amount)

    if (!title.trim() || !date || !categoryId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return
    }

    onSave({
      ...expense,
      title: title.trim(),
      description: description.trim(),
      amount: numericAmount,
      categoryId,
      date,
      paymentMethod,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
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
              Update your transaction details.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close edit form"
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

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
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Notes (optional)
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
            />
          </label>

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
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  const dispatch = useAppDispatch()

  const filters = useAppSelector((state) => state.expenses.filters)
  const categories = useAppSelector((state) => state.categories)
  const expenses = useAppSelector(selectPaginatedExpenses)
  const pagination = useAppSelector(selectPaginationInfo)
  const filteredExpenses = useAppSelector(selectFilteredExpenses)

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  function handleSaveExpense(updatedExpense: Expense) {
    dispatch(updateExpense(updatedExpense))
    setEditingExpense(null)
  }

  function handleDeleteExpense(expense: Expense) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${expense.title}"? This action cannot be undone.`,
    )

    if (confirmed) {
      dispatch(deleteExpense(expense.id))
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">All expenses</h2>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, edit, and organize your transactions.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Search
          <input
            value={filters.search}
            onChange={(event) => dispatch(setSearch(event.target.value))}
            placeholder="Search by title or notes"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Category
          <select
            value={filters.categoryId}
            onChange={(event) =>
              dispatch(setCategoryFilter(event.target.value))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Payment method
          <select
            value={filters.paymentMethod}
            onChange={(event) =>
              dispatch(setPaymentMethodFilter(event.target.value))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
          >
            <option value="all">All payment methods</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Sort by
          <select
            value={filters.sortBy}
            onChange={(event) =>
              dispatch(
                setSorting({
                  sortBy: event.target.value as 'date' | 'amount' | 'title',
                  sortDirection: filters.sortDirection,
                }),
              )
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="title">Title</option>
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Sort direction
          <select
            value={filters.sortDirection}
            onChange={(event) =>
              dispatch(
                setSorting({
                  sortBy: filters.sortBy,
                  sortDirection: event.target.value as 'asc' | 'desc',
                }),
              )
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => dispatch(clearFilters())}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-4">Expense</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4 text-right">Amount</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {expenses.map((expense) => {
                const category = categories.find(
                  (item) => item.id === expense.categoryId,
                )

                return (
                  <tr key={expense.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {expense.title}
                      </p>

                      {expense.description && (
                        <p className="mt-1 text-xs text-slate-500">
                          {expense.description}
                        </p>
                      )}

                      {expense.notes && (
                        <p className="mt-1 text-xs text-slate-500">
                          Notes: {expense.notes}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {category?.name ?? 'Uncategorized'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(expense.date)}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {expense.paymentMethod}
                    </td>

                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                      {formatCurrency(expense.amount)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingExpense(expense)}
                          aria-label={`Edit ${expense.title}`}
                          title="Edit expense"
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expense)}
                          aria-label={`Delete ${expense.title}`}
                          title="Delete expense"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    No expenses match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {pagination.startItem}–{pagination.endItem} of{' '}
            {pagination.totalItems} expenses
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <label className="mr-2 text-sm text-slate-500">
              Per page
              <select
                value={filters.pageSize}
                onChange={(event) =>
                  dispatch(setPageSize(Number(event.target.value)))
                }
                className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>

            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() =>
                dispatch(setCurrentPage(pagination.currentPage - 1))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-slate-600">
              {pagination.currentPage} / {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() =>
                dispatch(setCurrentPage(pagination.currentPage + 1))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {editingExpense && (
        <ExpenseEditor
          key={editingExpense.id}
          expense={editingExpense}
          categories={categories}
          onSave={handleSaveExpense}
          onCancel={() => setEditingExpense(null)}
        />
      )}
    </section>
  )
}
