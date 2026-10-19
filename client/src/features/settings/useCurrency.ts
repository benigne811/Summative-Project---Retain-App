import { useAppSelector } from '../../app/hooks'
import { formatCurrency } from '../../utils/currency'

export function useCurrency() {
  const currency = useAppSelector((state) => state.settings.currency)
  return {
    currency,
    formatCurrency: (amount: number) => formatCurrency(amount, currency),
  }
}
