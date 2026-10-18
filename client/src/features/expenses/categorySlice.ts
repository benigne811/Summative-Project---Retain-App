
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ExpenseCategory } from '../../types/expense'

const categorySlice = createSlice({
  name: 'categories',
  initialState: [] as ExpenseCategory[],
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
