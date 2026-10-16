
import { useState, type FormEvent } from 'react'
import type {
  Expense,
  ExpenseCategory,
  PaymentMethod,
} from '../../types/expense'

export type ExpenseFormValues = Omit<
  Expense,
  'id' | 'createdAt' | 'updatedAt'
>

interface ExpenseFormProps {
  categories: ExpenseCategory[]
  initialExpense?: Expense
  onSubmit: (values: ExpenseFormValues) => void
  onCancel?: () => void
}

const paymentMethods: PaymentMethod[] = [
  'Cash',
  'Mobile Money',
  'Bank transfer',
  'Card',
  'Other',
]

function todayAsDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'

function ExpenseForm({
  categories,
  initialExpense,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [title, setTitle] = useState(initialExpense?.title ?? '')
  const [description, setDescription] = useState(
    initialExpense?.description ?? '',
  )
  const [amount, setAmount] = useState(
    initialExpense ? String(initialExpense.amount) : '',
  )
  const [categoryId, setCategoryId] = useState(
    initialExpense?.categoryId ?? categories[0]?.id ?? '',
  )
  const [date, setDate] = useState(
    initialExpense?.date ?? todayAsDateString(),
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initialExpense?.paymentMethod ?? 'Mobile Money',
  )
  const [notes, setNotes] = useState(initialExpense?.notes ?? '')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      setError('Please enter an expense title.')
      return
    }

    const numericAmount = Number(amount)

    if (!amount.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }

    if (!categoryId) {
      setError('Please select a category.')
      return
    }

    if (!date) {
      setError('Please select a date.')
      return
    }

    setError('')

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      amount: numericAmount,
      categoryId,
      date,
      paymentMethod,
      notes: notes.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="expense-title" className="text-sm font-medium">
          Title *
        </label>
        <input
          id="expense-title"
          className={inputClass}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Lunch"
          maxLength={100}
          required
        />
      </div>

      <div>
        <label htmlFor="expense-amount" className="text-sm font-medium">
          Amount (RWF) *
        </label>
        <input
          id="expense-amount"
          className={inputClass}
          type="number"
          min="0.01"
          step="any"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="e.g. 5000"
          required
        />
      </div>

      <div>
        <label htmlFor="expense-category" className="text-sm font-medium">
          Category *
        </label>
        <select
          id="expense-category"
          className={inputClass}
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          required
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-date" className="text-sm font-medium">
          Date *
        </label>
        <input
          id="expense-date"
          className={inputClass}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="expense-payment" className="text-sm font-medium">
          Payment method *
        </label>
        <select
          id="expense-payment"
          className={inputClass}
          value={paymentMethod}
          onChange={(event) =>
            setPaymentMethod(event.target.value as PaymentMethod)
          }
        >
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="expense-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="expense-description"
          className={inputClass}
          rows={2}
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What was this expense for?"
        />
      </div>

      <div>
        <label htmlFor="expense-notes" className="text-sm font-medium">
          Additional notes
        </label>
        <textarea
          id="expense-notes"
          className={inputClass}
          rows={2}
          maxLength={1000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional details"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {initialExpense ? 'Save changes' : 'Add expense'}
        </button>
      </div>
    </form>
  )
}

export default ExpenseForm
