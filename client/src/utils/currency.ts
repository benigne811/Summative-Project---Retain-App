import { currencyOptions, type CurrencyCode } from '../features/settings/settingsSlice'

export function formatCurrency(amount: number, currency: CurrencyCode) {
  const locale = currencyOptions.find((option) => option.code === currency)?.locale ?? 'en-RW'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
