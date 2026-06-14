const BASE_URL = 'https://api.worldbank.org/v2'

/**
 * Fetches indicator data for all countries.
 * Returns an object indexed by ISO2 code: { 'NL': 52000, 'DE': 46000, ... }
 * Countries with null values are excluded.
 */
export async function fetchIndicatorAllCountries(indicator, { mrv = 5 } = {}) {
  const perPage = Math.max(1500, mrv * 300)
  const url = `${BASE_URL}/country/all/indicator/${indicator}?format=json&mrv=${mrv}&per_page=${perPage}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`World Bank API error: ${res.status}`)

  const json = await res.json()
  const dataArray = json[1] ?? []

  // API returns years descending per country — first non-null hit is most recent.
  const result = {}
  dataArray.forEach((entry) => {
    if (entry.value === null) return
    const iso2 = entry.country?.id
    if (!iso2 || iso2.length !== 2) return
    if (!(iso2 in result)) result[iso2] = entry.value
  })

  return result
}

/**
 * Fetches one indicator for a specific list of countries (supplemental pass).
 * Returns { iso2: value } for countries that have data.
 */
export async function fetchIndicatorForCountries(iso2Codes, indicator, { mrv = 10 } = {}) {
  if (!iso2Codes.length) return {}
  const codesStr = iso2Codes.join(';')
  const url = `${BASE_URL}/country/${codesStr}/indicator/${indicator}?format=json&mrv=${mrv}&per_page=${iso2Codes.length * mrv + 50}`
  const res = await fetch(url)
  if (!res.ok) return {}
  const json = await res.json()
  const dataArray = json[1] ?? []
  const result = {}
  dataArray.forEach((entry) => {
    if (entry.value === null) return
    const iso2 = entry.country?.id
    if (!iso2 || iso2.length !== 2) return
    if (!(iso2 in result)) result[iso2] = entry.value
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