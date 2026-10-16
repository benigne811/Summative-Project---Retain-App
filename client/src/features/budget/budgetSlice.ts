
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MonthlyBudget } from '../../types/budget'

interface BudgetsState {
  items: MonthlyBudget[]
}

const initialState: BudgetsState = {
  items: [],
}

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    setBudgets(state, action: PayloadAction<MonthlyBudget[]>) {
      state.items = action.payload
    },

    saveBudget(state, action: PayloadAction<MonthlyBudget>) {
      const existingIndex = state.items.findIndex(
        (budget) => budget.month === action.payload.month,
      )

      if (existingIndex >= 0) {
        state.items[existingIndex] = action.payload
      } else {
        state.items.push(action.payload)
      }
    },

    deleteBudget(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (budget) => budget.month !== action.payload,
      )
    },
  },
})

export const { setBudgets, saveBudget, deleteBudget } = budgetSlice.actions

export default budgetSlice.reducer
