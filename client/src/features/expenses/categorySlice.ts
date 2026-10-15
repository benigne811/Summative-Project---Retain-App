
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ExpenseCategory } from '../../types/expense'

const initialCategories: ExpenseCategory[] = [
  { id: 'food', name: 'Food & Groceries', color: '#F59E0B' },
  { id: 'transport', name: 'Transport', color: '#3B82F6' },
  { id: 'housing', name: 'Housing', color: '#8B5CF6' },
  { id: 'utilities', name: 'Utilities', color: '#06B6D4' },
  { id: 'health', name: 'Health', color: '#10B981' },
  { id: 'education', name: 'Education', color: '#EC4899' },
  { id: 'shopping', name: 'Shopping', color: '#F97316' },
  { id: 'entertainment', name: 'Entertainment', color: '#6366F1' },
  { id: 'other', name: 'Other', color: '#64748B' },
]

const categorySlice = createSlice({
  name: 'categories',
  initialState: initialCategories,
  reducers: {
    setCategories: (
      _state,
      action: PayloadAction<ExpenseCategory[]>,
    ) => action.payload,

    addCategory: (state, action: PayloadAction<ExpenseCategory>) => {
      state.push(action.payload)
    },

    updateCategory: (state, action: PayloadAction<ExpenseCategory>) => {
      const index = state.findIndex(
        (category) => category.id === action.payload.id,
      )

      if (index !== -1) {
        state[index] = action.payload
      }
    },

    deleteCategory: (state, action: PayloadAction<string>) =>
      state.filter((category) => category.id !== action.payload),
  },
})

export const {
  setCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = categorySlice.actions

export default categorySlice.reducer
