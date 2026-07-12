import { useEffect } from 'react'
import useStore from '../store/useStore'
import { fetchIndicatorsForCountry } from '../utils/worldBank'
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

  // Fetch World Bank sidebar indicators for the selected country
  useEffect(() => {
    if (!selectedCountry?.code || selectedCountry.code === '-99') return

    const indicators = SIDEBAR_INDICATORS.map((i) => i.indicator)
    setWorldBankCountryData(null)
    setWorldBankCountryLoading(true)
    fetchIndicatorsForCountry(selectedCountry.code, indicators)
      .then(setWorldBankCountryData)
      .catch((err) => {
        console.error('World Bank country fetch failed:', err)
        setLastError(`Failed to load country indicators: ${err.message}`)
      })
      .finally(() => setWorldBankCountryLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry])
}
