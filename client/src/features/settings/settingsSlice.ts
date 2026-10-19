import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export const currencyOptions = [
  { code: 'RWF', label: 'Rwandan franc (RWF)', locale: 'en-RW' },
  { code: 'USD', label: 'US dollar (USD)', locale: 'en-US' },
  { code: 'CDF', label: 'Congolese franc (CDF)', locale: 'fr-CD' },
  { code: 'EUR', label: 'Euro (EUR)', locale: 'en-IE' },
  { code: 'GBP', label: 'Pound sterling (GBP)', locale: 'en-GB' },
  { code: 'KES', label: 'Kenyan shilling (KES)', locale: 'en-KE' },
  { code: 'UGX', label: 'Ugandan shilling (UGX)', locale: 'en-UG' },
  { code: 'TZS', label: 'Tanzanian shilling (TZS)', locale: 'en-TZ' },
] as const

export type CurrencyCode = (typeof currencyOptions)[number]['code']

function loadCurrency(): CurrencyCode {
  try {
    const savedCurrency = window.localStorage.getItem('retain_currency')
    if (currencyOptions.some(({ code }) => code === savedCurrency)) {
      return savedCurrency as CurrencyCode
    }
  } catch {
    // Use the default when browser storage is unavailable.
  }
  return 'RWF'
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: { currency: loadCurrency() },
  reducers: {
    setCurrency(state, action: PayloadAction<CurrencyCode>) {
      state.currency = action.payload
    },
  },
})

export const { setCurrency } = settingsSlice.actions
export default settingsSlice.reducer
