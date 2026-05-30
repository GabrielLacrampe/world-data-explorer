const BASE_URL = 'https://api.worldbank.org/v2'

/**
 * Fetches indicator data for all countries.
 * Returns an object indexed by ISO2 code: { 'NL': 52000, 'DE': 46000, ... }
 * Countries with null values are excluded.
 */
export async function fetchIndicatorAllCountries(indicator) {
  const url = `${BASE_URL}/country/all/indicator/${indicator}?format=json&mrv=1&per_page=300`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`World Bank API error: ${res.status}`)

  const json = await res.json()
  const dataArray = json[1] ?? []

  const result = {}
  dataArray.forEach((entry) => {
    if (entry.value !== null && entry.countryiso3code) {
      // World Bank returns ISO3 — we need ISO2
      // We'll match by country id which is ISO2 in most cases
      const iso2 = entry.country?.id
      if (iso2 && iso2.length === 2) {
        result[iso2] = entry.value
      }
    }
  })

  return result
}

/**
 * Fetches multiple indicators for a single country.
 * Returns an object: { 'NY.GDP.PCAP.CD': 52000, 'SL.UEM.TOTL.ZS': 3.8, ... }
 */
export async function fetchIndicatorsForCountry(iso2, indicators) {
  const results = {}

  await Promise.all(
    indicators.map(async (indicator) => {
      try {
        const url = `${BASE_URL}/country/${iso2}/indicator/${indicator}?format=json&mrv=1`
        const res = await fetch(url)
        if (!res.ok) return
        const json = await res.json()
        const value = json[1]?.[0]?.value ?? null
        results[indicator] = value
      } catch {
        results[indicator] = null
      }
    })
  )

  return results
}

/**
 * Formats a World Bank value for display in the sidebar.
 */
export function formatIndicatorValue(value, format, unit) {
  if (value === null || value === undefined) return 'No data'

  switch (format) {
    case 'currency':
      return `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })} ${unit}`
    case 'percent':
      return `${Number(value).toFixed(1)}%`
    case 'decimal':
      return `${Number(value).toFixed(1)} ${unit}`
    default:
      return `${value} ${unit}`
  }
}