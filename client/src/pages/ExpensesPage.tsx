
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  setSearch,
  setCategoryFilter,
  setPaymentMethodFilter,
  setSorting,
  setCurrentPage,
  setPageSize,
  clearFilters,
} from '../features/expenses/expenseSlice'
import {
  selectFilteredExpenses,
  selectPaginatedExpenses,
  selectPaginationInfo,
} from '../features/expenses/expenseSelectors'

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

export default function ExpensesPage() {
  const dispatch = useAppDispatch()

  const filters = useAppSelector((state) => state.expenses.filters)
  const categories = useAppSelector((state) => state.categories)
  const expenses = useAppSelector(selectPaginatedExpenses)
  const pagination = useAppSelector(selectPaginationInfo)
  const filteredExpenses = useAppSelector(selectFilteredExpenses)

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">All expenses</h2>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, and organize your transactions.
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
            onChange={(event) => dispatch(setCategoryFilter(event.target.value))}
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
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank transfer">Bank transfer</option>
            <option value="Mobile Money">Mobile Money</option>
            <option value="Other">Other</option>
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
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-4">Expense</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4 text-right">Amount</th>
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
                      {expense.notes && (
                        <p className="mt-1 text-xs text-slate-500">
                          {expense.notes}
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
                  </tr>
                )
              })}

              {filteredExpenses.length === 0 && (
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

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {pagination.startItem}–{pagination.endItem} of{' '}
            {pagination.totalItems} expenses
          </p>

          <div className="flex items-center gap-2">
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
    </section>
  )
}
