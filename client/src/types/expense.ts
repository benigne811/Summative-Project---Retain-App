
export type PaymentMethod =
  | 'Cash'
  | 'Mobile Money'
  | 'Bank transfer'
  | 'Card'
  | 'Other'

export interface Expense {
  id: string
  title: string
  amount: number
  categoryId: string
  date: string
  paymentMethod: PaymentMethod
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface ExpenseCategory {
  id: string
  name: string
  color?: string
}
