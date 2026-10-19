import { useState } from 'react'
import { useAppDispatch } from '../app/hooks'
import { currencyOptions, setCurrency, type CurrencyCode } from '../features/settings/settingsSlice'
import { useCurrency } from '../features/settings/useCurrency'

export default function SettingsPage() {
  const dispatch = useAppDispatch()
  const { currency } = useCurrency()
  const [saved, setSaved] = useState(false)

  function handleCurrencyChange(value: CurrencyCode) {
    dispatch(setCurrency(value))
    setSaved(false)
    try {
      window.localStorage.setItem('retain_currency', value)
      setSaved(true)
    } catch {
      // The setting remains active until the page reloads if storage is unavailable.
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Settings</h2>
        <p className="mt-2 text-sm text-slate-500">Choose how amounts are shown in Retain.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label htmlFor="currency-setting" className="block text-sm font-semibold text-slate-800">Display currency</label>
        <p className="mt-1 text-sm text-slate-500">This changes the currency format only. It does not convert saved amounts.</p>
        <select
          id="currency-setting"
          value={currency}
          onChange={(event) => handleCurrencyChange(event.target.value as CurrencyCode)}
          className="mt-4 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-500 sm:max-w-md"
        >
          {currencyOptions.map((option) => (
            <option key={option.code} value={option.code}>{option.label}</option>
          ))}
        </select>
        {saved && <p role="status" className="mt-3 text-sm text-emerald-700">Currency saved on this browser.</p>}
      </section>
    </div>
  )
}
