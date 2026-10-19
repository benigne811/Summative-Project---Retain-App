import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { addCategory, deleteCategory, setCategories, updateCategory } from '../features/expenses/categorySlice'
import { setExpenses } from '../features/expenses/expenseSlice'
import { apiRequest } from '../services/api'
import { useAuth } from '../context/useAuth'
import type { ExpenseCategory } from '../types/expense'
import type { Expense } from '../types/expense'

interface AdminInsights {
  currentMonth: string
  totals: {
    totalUsers: number
    totalExpenses: number
    totalExpenseValue: number
    currentMonthExpenses: number
  }
  spendingByCategory: Array<{
    categoryId: string
    categoryName: string
    color?: string
    expenseCount: number
    totalAmount: number
  }>
  mostUsedCategories: Array<{ categoryId: string; categoryName: string; expenseCount: number }>
  leastUsedCategories: Array<{ categoryId: string; categoryName: string; expenseCount: number }>
  recentExpenses: Array<{
    id: string
    title: string
    amount: number
    categoryId: string
    date: string
    userName?: string
    userEmail?: string
  }>
  recentUsers: Array<{ id: string; name: string; email: string; role: string; createdAt: string }>
}

const emptyInsights: AdminInsights = {
  currentMonth: '',
  totals: { totalUsers: 0, totalExpenses: 0, totalExpenseValue: 0, currentMonthExpenses: 0 },
  spendingByCategory: [],
  mostUsedCategories: [],
  leastUsedCategories: [],
  recentExpenses: [],
  recentUsers: [],
}

function currency(value: number) {
  return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(value)
}

function dateLabel(value: string) {
  if (!value) return '—'
  const parsed = new Date(value.includes('T') ? value : `${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminPage() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const categories = useAppSelector((state) => state.categories)
  const [insights, setInsights] = useState(emptyInsights)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<ExpenseCategory | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#10b981')

  const loadInsights = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest<AdminInsights>('/api/admin/insights')
      setInsights(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load admin insights.')
    } finally {
      setLoading(false)
    }
  }, [])

 useEffect(() => {
  let active = true

  async function fetchInitialInsights() {
    try {
      const data = await apiRequest<AdminInsights>('/api/admin/insights')
      if (active) setInsights(data)
    } catch (loadError) {
      if (active) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Could not load admin insights.',
        )
      }
    } finally {
      if (active) setLoading(false)
    }
  }

  void fetchInitialInsights()

  return () => {
    active = false
  }
}, [])

  function startEdit(category: ExpenseCategory) {
    setEditing(category)
    setName(category.name)
    setColor(category.color ?? '#10b981')
    setError('')
    setNotice('')
  }

  function resetForm() {
    setEditing(null)
    setName('')
    setColor('#10b981')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = { name: name.trim(), color }
      if (editing) {
        const saved = await apiRequest<ExpenseCategory>(`/api/categories/${encodeURIComponent(editing.id)}`, {
          method: 'PUT', body: JSON.stringify(payload),
        })
        dispatch(updateCategory(saved))
        setNotice('Category updated.')
      } else {
        const saved = await apiRequest<ExpenseCategory>('/api/categories', {
          method: 'POST', body: JSON.stringify(payload),
        })
        dispatch(addCategory(saved))
        setNotice('Category created.')
      }
      resetForm()
      await loadInsights()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save this category.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category: ExpenseCategory) {
    if (category.id === 'other') {
      setError('The default Other category cannot be deleted.')
      return
    }
    if (!window.confirm(`Delete “${category.name}”? Existing expenses will move to Other.`)) return
    setError('')
    setNotice('')
    try {
      await apiRequest<void>(`/api/categories/${encodeURIComponent(category.id)}`, { method: 'DELETE' })
      dispatch(deleteCategory(category.id))
      const [updatedCategories, updatedExpenses] = await Promise.all([
        apiRequest<ExpenseCategory[]>('/api/categories'),
        apiRequest<Expense[]>('/api/expenses'),
      ])
      dispatch(setCategories(updatedCategories))
      dispatch(setExpenses(updatedExpenses))
      setNotice('Category deleted. Its expenses are now uncategorized under Other.')
      if (editing?.id === category.id) resetForm()
      await loadInsights()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete this category.')
    }
  }

  if (user?.role !== 'admin') {
    return <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Administrator access is required.</p>
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Admin</h2>
        </div>
        <button type="button" onClick={() => void loadInsights()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh insights
        </button>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Registered users" value={loading ? '…' : String(insights.totals.totalUsers)} />
        <Metric label="Expenses recorded" value={loading ? '…' : String(insights.totals.totalExpenses)} />
        <Metric label="Recorded value" value={loading ? '…' : currency(insights.totals.totalExpenseValue)} />
        <Metric label="Expenses this month" value={loading ? '…' : String(insights.totals.currentMonthExpenses)} detail={insights.currentMonth} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">Manage categories</h3>
          <p className="mt-1 text-sm text-slate-500">Categories are shared across the platform.</p>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <label className="text-sm font-medium text-slate-700">Category name
              <input required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Education" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500" />
            </label>
            <label className="text-sm font-medium text-slate-700">Color
              <input type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label="Category color" className="mt-1 block h-11 w-16 rounded-lg border border-slate-200 bg-white p-1" />
            </label>
            <div className="flex gap-2">
              {editing && <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600">Cancel</button>}
              <button type="submit" disabled={saving || !name.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {editing ? <Pencil size={16} /> : <Plus size={17} />}{saving ? 'Saving…' : editing ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
          <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color ?? '#94a3b8' }} />
                  <span className="truncate text-sm font-medium text-slate-800">{category.name}</span>
                  {category.id === 'other' && <span className="text-xs text-slate-400">default</span>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" aria-label={`Edit ${category.name}`} onClick={() => startEdit(category)} className="rounded-lg p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"><Pencil size={16} /></button>
                  <button type="button" aria-label={`Delete ${category.name}`} onClick={() => void handleDelete(category)} disabled={category.id === 'other'} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className="p-4 text-sm text-slate-500">No categories have loaded yet.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <CategoryRank title="Most used categories" rows={insights.mostUsedCategories} loading={loading} />
          <CategoryRank title="Least used categories" rows={insights.leastUsedCategories} loading={loading} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">Total spending per category</h3>
          <div className="mt-4 divide-y divide-slate-100">
            {insights.spendingByCategory.map((row) => <div key={row.categoryId} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 truncate text-slate-700"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color ?? '#94a3b8' }} />{row.categoryName}</span>
              <span className="shrink-0 text-right font-semibold text-slate-900">{currency(row.totalAmount)} <span className="font-normal text-slate-400">· {row.expenseCount}</span></span>
            </div>)}
            {!loading && insights.spendingByCategory.length === 0 && <p className="py-6 text-sm text-slate-500">No category data available.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="font-bold text-slate-900">Recently added expenses</h3>
          <div className="mt-4 divide-y divide-slate-100">
            {insights.recentExpenses.map((expense) => <div key={expense.id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{expense.title}</p><p className="mt-1 truncate text-xs text-slate-500">{expense.userName ?? expense.userEmail ?? 'Unknown user'} · {dateLabel(expense.date)}</p></div>
              <p className="shrink-0 text-sm font-semibold text-slate-900">{currency(expense.amount)}</p>
            </div>)}
            {!loading && insights.recentExpenses.length === 0 && <p className="py-6 text-sm text-slate-500">No expenses have been recorded.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="font-bold text-slate-900">Recently registered users</h3>
        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="pb-3">Name</th><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3 text-right">Registered</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{insights.recentUsers.map((recentUser) => <tr key={recentUser.id}><td className="py-3 font-medium text-slate-800">{recentUser.name}</td><td className="py-3 text-slate-500">{recentUser.email}</td><td className="py-3 capitalize text-slate-500">{recentUser.role}</td><td className="py-3 text-right text-slate-500">{dateLabel(recentUser.createdAt)}</td></tr>)}</tbody>
          </table>
          {!loading && insights.recentUsers.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No users have registered yet.</p>}
        </div>
        <div className="mt-4 divide-y divide-slate-100 md:hidden">
          {insights.recentUsers.map((recentUser) => (
            <article key={recentUser.id} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words text-sm font-semibold text-slate-800">
                  {recentUser.name}
                </p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">
                  {recentUser.role}
                </span>
              </div>
              <p className="mt-1 break-all text-xs text-slate-500">{recentUser.email}</p>
              <p className="mt-1 text-xs text-slate-400">
                Registered {dateLabel(recentUser.createdAt)}
              </p>
            </article>
          ))}
          {!loading && insights.recentUsers.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-500">
              No users have registered yet.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 break-words text-2xl font-bold text-slate-900">{value}</p>{detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}</div>
}

function CategoryRank({ title, rows, loading }: { title: string; rows: AdminInsights['mostUsedCategories']; loading: boolean }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h3 className="font-bold text-slate-900">{title}</h3><div className="mt-3 divide-y divide-slate-100">{rows.map((row, index) => <div key={row.categoryId} className="flex items-center justify-between py-2.5 text-sm"><span className="text-slate-700"><span className="mr-3 text-xs text-slate-400">{index + 1}.</span>{row.categoryName}</span><span className="font-semibold text-slate-900">{row.expenseCount}</span></div>)}{!loading && rows.length === 0 && <p className="py-4 text-sm text-slate-500">No categories to rank.</p>}</div></div>
}
