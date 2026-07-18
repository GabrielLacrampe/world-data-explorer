import { useEffect } from 'react'
import useStore from '../store/useStore'
import { fetchIndicatorsForCountry } from '../utils/worldBank'
import { getDatasetsBatch, wbKey } from '../lib/datasets'
import { SIDEBAR_INDICATORS } from '../layers'

export default function useCountryData() {
  const selectedCountry            = useStore((s) => s.selectedCountry)
  const allCountriesData           = useStore((s) => s.allCountriesData)
  const setCountryData             = useStore((s) => s.setCountryData)
  const setLoading                 = useStore((s) => s.setLoading)
  const setCountryLoadError        = useStore((s) => s.setCountryLoadError)
  const setWorldBankCountryData    = useStore((s) => s.setWorldBankCountryData)
  const setWorldBankCountryLoading = useStore((s) => s.setWorldBankCountryLoading)
  const setLastError               = useStore((s) => s.setLastError)

  // Resolve REST Countries data for the selected country
  useEffect(() => {
    if (!selectedCountry || !allCountriesData) return

    const code = selectedCountry.code
    if (code && code !== '-99' && allCountriesData[code]) {
      setCountryData(allCountriesData[code])
    } else {
      const match = Object.values(allCountriesData).find(
        (c) => c.name?.common?.toLowerCase() === selectedCountry.name?.toLowerCase()
      )
      setCountryData(match ?? null)
      if (!match) setCountryLoadError(true)
    }
    setLoading('country', false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry, allCountriesData])

  // Fetch World Bank sidebar indicators for the selected country. All
  // indicator snapshots come back in one Supabase batch query; only the
  // indicators without a snapshot fall back to the live per-country fetch.
  useEffect(() => {
    if (!selectedCountry?.code || selectedCountry.code === '-99') return

    const iso2 = selectedCountry.code
    const indicators = SIDEBAR_INDICATORS.map((i) => i.indicator)
    let cancelled = false
    setWorldBankCountryData(null)
    setWorldBankCountryLoading(true)
    ;(async () => {
      const snapshots = await getDatasetsBatch(indicators.map(wbKey))

      const values = {}
      const missing = []
      indicators.forEach((indicator) => {
        const snapshot = snapshots[wbKey(indicator)]
        if (snapshot) values[indicator] = snapshot[iso2] ?? null
        else missing.push(indicator)
      })

      if (missing.length > 0) {
        Object.assign(values, await fetchIndicatorsForCountry(iso2, missing))
      }
      if (!cancelled) setWorldBankCountryData(values)
    })()
      .catch((err) => {
        if (cancelled) return
        console.error('World Bank country fetch failed:', err)
        setLastError(`Failed to load country indicators: ${err.message}`)
      })
      .finally(() => {
        if (!cancelled) setWorldBankCountryLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry])
}
