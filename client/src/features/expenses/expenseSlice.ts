
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Expense } from '../../types/expense'

export type SortField = 'date' | 'amount' | 'title'
export type SortDirection = 'asc' | 'desc'

interface ExpenseFilters {
  search: string
  categoryId: string
  paymentMethod: string
  startDate: string
  endDate: string
  minAmount: string
  maxAmount: string
  sortBy: SortField
  sortDirection: SortDirection
  currentPage: number
  pageSize: number
}

interface ExpensesState {
  items: Expense[]
  filters: ExpenseFilters
}

const initialState: ExpensesState = {
  items: [],
  filters: {
    search: '',
    categoryId: 'all',
    paymentMethod: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortDirection: 'desc',
    currentPage: 1,
    pageSize: 10,
  },
}

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setExpenses(state, action: PayloadAction<Expense[]>) {
      state.items = action.payload
      state.filters.currentPage = 1
    },

    addExpense(state, action: PayloadAction<Expense>) {
      state.items.push(action.payload)
    },

    updateExpense(state, action: PayloadAction<Expense>) {
      const index = state.items.findIndex(
        (expense) => expense.id === action.payload.id,
      )

      if (index !== -1) {
        state.items[index] = action.payload
      }
    },

    deleteExpense(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (expense) => expense.id !== action.payload,
      )
      state.filters.currentPage = 1
    },

    setSearch(state, action: PayloadAction<string>) {
      state.filters.search = action.payload
      state.filters.currentPage = 1
    },

    setCategoryFilter(state, action: PayloadAction<string>) {
      state.filters.categoryId = action.payload
      state.filters.currentPage = 1
    },

    setPaymentMethodFilter(state, action: PayloadAction<string>) {
      state.filters.paymentMethod = action.payload
      state.filters.currentPage = 1
    },

    setDateRange(
      state,
      action: PayloadAction<{ startDate: string; endDate: string }>,
    ) {
      state.filters.startDate = action.payload.startDate
      state.filters.endDate = action.payload.endDate
      state.filters.currentPage = 1
    },

    setAmountRange(
      state,
      action: PayloadAction<{ minAmount: string; maxAmount: string }>,
    ) {
      state.filters.minAmount = action.payload.minAmount
      state.filters.maxAmount = action.payload.maxAmount
      state.filters.currentPage = 1
    },

    setSorting(
      state,
      action: PayloadAction<{
        sortBy: SortField
        sortDirection: SortDirection
      }>,
    ) {
      state.filters.sortBy = action.payload.sortBy
      state.filters.sortDirection = action.payload.sortDirection
    },

    setCurrentPage(state, action: PayloadAction<number>) {
      state.filters.currentPage = Math.max(1, action.payload)
    },

    setPageSize(state, action: PayloadAction<number>) {
      state.filters.pageSize = Math.max(1, action.payload)
      state.filters.currentPage = 1
    },

    clearFilters(state) {
      state.filters = initialState.filters
    },
  },
})

export const {
  setExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  setSearch,
  setCategoryFilter,
  setPaymentMethodFilter,
  setDateRange,
  setAmountRange,
  setSorting,
  setCurrentPage,
  setPageSize,
  clearFilters,
} = expenseSlice.actions

export default expenseSlice.reducer
