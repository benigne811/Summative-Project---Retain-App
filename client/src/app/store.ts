
import { configureStore } from '@reduxjs/toolkit'
import expenseReducer from '../features/expenses/expenseSlice'
import categoryReducer from '../features/expenses/categorySlice'

export const store = configureStore({
  reducer: {
    expenses: expenseReducer,
    categories: categoryReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
