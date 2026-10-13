
import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import type { Expense } from '../../types/expense'

const selectExpenses = (state: RootState) => state.expenses.items

const selectFilters = (state: RootState) => state.expenses.filters

export const selectFilteredExpenses = createSelector(
  [selectExpenses, selectFilters],
  (expenses, filters): Expense[] => {
    const searchTerm = filters.search.trim().toLowerCase()

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

      const matchesStartDate =
        !filters.startDate || expense.date >= filters.startDate

      const matchesEndDate =
        !filters.endDate || expense.date <= filters.endDate

      const matchesMinAmount =
        filters.minAmount === '' ||
        expense.amount >= Number(filters.minAmount)

      const matchesMaxAmount =
        filters.maxAmount === '' ||
        expense.amount <= Number(filters.maxAmount)

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
      let comparison = 0

      switch (filters.sortBy) {
        case 'amount':
          comparison = a.amount - b.amount
          break

        case 'title':
          comparison = a.title.localeCompare(b.title)
          break

        case 'date':
        default:
          comparison = a.date.localeCompare(b.date)
          break
      }

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

    return {
      totalItems,
      totalPages,
      currentPage: Math.min(filters.currentPage, totalPages),
      pageSize: filters.pageSize,
      startItem:
        totalItems === 0
          ? 0
          : (filters.currentPage - 1) * filters.pageSize + 1,
      endItem: Math.min(
        filters.currentPage * filters.pageSize,
        totalItems,
      ),
    }
  },
)
