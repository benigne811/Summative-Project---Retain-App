
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import type { Expense } from '../../types/expense'

const selectExpenses = (state: RootState) => state.expenses.items

const selectFilters = (state: RootState) => state.expenses.filters

export const selectFilteredExpenses = createSelector(
  [selectExpenses, selectFilters],
  (expenses, filters): Expense[] => {
    const searchTerm = filters.search.trim().toLowerCase()
    const minAmount = filters.minAmount === '' ? null : Number(filters.minAmount)
    const maxAmount = filters.maxAmount === '' ? null : Number(filters.maxAmount)

    const filtered = expenses.filter((expense) => {
      const matchesSearch =
        !searchTerm ||
        expense.title.toLowerCase().includes(searchTerm) ||
        (expense.description ?? '').toLowerCase().includes(searchTerm) ||
        (expense.notes ?? '').toLowerCase().includes(searchTerm)

      const matchesCategory =
        filters.categoryId === 'all' ||
        expense.categoryId === filters.categoryId

      const matchesPaymentMethod =
        filters.paymentMethod === 'all' ||
        expense.paymentMethod === filters.paymentMethod

      const expenseDate = expense.date.slice(0, 10)
      const matchesStartDate =
        !filters.startDate || expenseDate >= filters.startDate

      const matchesEndDate =
        !filters.endDate || expenseDate <= filters.endDate

      const matchesMinAmount =
        minAmount === null ||
        (Number.isFinite(minAmount) && expense.amount >= minAmount)

      const matchesMaxAmount =
        maxAmount === null ||
        (Number.isFinite(maxAmount) && expense.amount <= maxAmount)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesPaymentMethod &&
        matchesStartDate &&
        matchesEndDate &&
        matchesMinAmount &&
        matchesMaxAmount
      )
    })

    return [...filtered].sort((a, b) => {
      const comparison =
        filters.sortBy === 'amount'
          ? a.amount - b.amount
          : filters.sortBy === 'title'
            ? a.title.localeCompare(b.title)
            : a.date.localeCompare(b.date)

      return filters.sortDirection === 'asc'
        ? comparison
        : -comparison
    })
  },
)

export const selectPaginatedExpenses = createSelector(
  [selectFilteredExpenses, selectFilters],
  (expenses, filters) => {
    const startIndex = (filters.currentPage - 1) * filters.pageSize

    return expenses.slice(startIndex, startIndex + filters.pageSize)
  },
)

export const selectPaginationInfo = createSelector(
  [selectFilteredExpenses, selectFilters],
  (expenses, filters) => {
    const totalItems = expenses.length
    const totalPages = Math.max(
      1,
      Math.ceil(totalItems / filters.pageSize),
    )
    const currentPage = Math.min(filters.currentPage, totalPages)

    return {
      totalItems,
      totalPages,
      currentPage,
      pageSize: filters.pageSize,
      startItem:
        totalItems === 0
          ? 0
          : (currentPage - 1) * filters.pageSize + 1,
      endItem: Math.min(currentPage * filters.pageSize, totalItems),
    }
  },
)
