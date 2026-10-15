
import { useAppSelector } from '../../app/hooks'
import {
  selectFilteredExpenses,
  selectPaginatedExpenses,
  selectPaginationInfo,
} from './expenseSelectors'

export function useExpenses() {
  const filteredExpenses = useAppSelector(selectFilteredExpenses)
  const paginatedExpenses = useAppSelector(selectPaginatedExpenses)
  const pagination = useAppSelector(selectPaginationInfo)

  return {
    filteredExpenses,
    paginatedExpenses,
    pagination,
  }
}
