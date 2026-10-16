
import { configureStore } from '@reduxjs/toolkit'
import expenseReducer from '../features/expenses/expenseSlice'
import categoryReducer from '../features/expenses/categorySlice'
import budgetReducer from '../features/budget/budgetSlice'

export const store = configureStore({
  reducer: {
    expenses: expenseReducer,
    categories: categoryReducer,
    budgets: budgetReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
