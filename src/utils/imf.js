const BASE_URL = 'https://api.imf.org/external/sdmx/2.1/data'

/**
 * Fetches an IMF SDMX indicator for all countries and returns each one's
 * most recent available value, keyed by ISO3.
 *
 * Uses api.imf.org (the SDMX Data API), not the www.imf.org DataMapper
 * convenience API — DataMapper's JSON is simpler but its server sends no
 * Access-Control-Allow-Origin header, so browser fetches fail with a CORS
 * error even though the same request works fine from curl/Node. The SDMX
 * API returns `Access-Control-Allow-Origin: *` and is used everywhere else
 * in this file for that reason.
 */
export async function fetchImfIndicatorLatest(indicator, { dataflow = 'GDD', freq = 'A', startPeriod = '2015' } = {}) {
  const url = `${BASE_URL}/${dataflow}/.${indicator}.${freq}?startPeriod=${startPeriod}&format=jsondata`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`IMF API error: ${res.status}`)

  const json = await res.json()
  const seriesDims = json.structure?.dimensions?.series ?? []
  const countryDim = seriesDims.find((d) => d.id === 'COUNTRY')
  const timeValues = json.structure?.dimensions?.observation?.[0]?.values ?? []
  const series = json.dataSets?.[0]?.series ?? {}
  if (!countryDim) return {}

  const result = {}
  Object.entries(series).forEach(([seriesKey, s]) => {
    const countryIndex = Number(seriesKey.split(':')[countryDim.keyPosition])
    const iso3 = countryDim.values[countryIndex]?.id
    if (!iso3) return

    const observations = Object.entries(s.observations ?? {})
      .map(([timeIndex, obs]) => ({
        year: timeValues[Number(timeIndex)]?.id,
        value: obs[0] !== null && obs[0] !== undefined ? Number(obs[0]) : null,
      }))
      .filter((o) => o.year && o.value !== null && !Number.isNaN(o.value))
      .sort((a, b) => a.year.localeCompare(b.year))

    if (observations.length === 0) return
    result[iso3] = observations[observations.length - 1].value
  })

  return result
}
