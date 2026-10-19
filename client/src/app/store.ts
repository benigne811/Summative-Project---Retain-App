
import { configureStore } from '@reduxjs/toolkit'
import expenseReducer from '../features/expenses/expenseSlice'
import categoryReducer from '../features/expenses/categorySlice'
import budgetReducer from '../features/budget/budgetSlice'
import settingsReducer from '../features/settings/settingsSlice'

export const store = configureStore({
  reducer: {
    expenses: expenseReducer,
    categories: categoryReducer,
    budgets: budgetReducer,
    settings: settingsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
