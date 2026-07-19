import { LAYERS } from '../layers'
import { getLayerValueForCountry, getLayerDataMap } from './tooltipContent'

/**
 * Converts an ISO3-keyed data map (imf layers) to ISO2 using allCountriesData's
 * cca3 field — mirrors the same conversion getLayerValueForCountry does for a
 * single country, just for the whole distribution at once.
 */
function toIso2Map(dataMap, allCountriesData) {
  const iso3ToIso2 = {}
  for (const [iso2, country] of Object.entries(allCountriesData ?? {})) {
    if (country.cca3) iso3ToIso2[country.cca3] = iso2
  }
  const out = {}
  for (const [iso3, value] of Object.entries(dataMap)) {
    const iso2 = iso3ToIso2[iso3]
    if (iso2) out[iso2] = value
  }
  return out
}

/**
 * Averages peer values within the selected country's subregion, falling
 * back to its broader region when there aren't enough subregion peers
 * (<3) to make an average meaningful.
 */
function computeRegionAverage(iso2Map, allCountriesData, iso2) {
  const subject = allCountriesData?.[iso2]
  if (!subject) return null

  const peersIn = (field) => {
    const target = subject[field]
    if (!target) return null
    const values = Object.entries(iso2Map)
      .filter(([code, v]) =>
        code !== iso2 && v !== null && v !== undefined && allCountriesData[code]?.[field] === target
      )
      .map(([, v]) => v)
    if (values.length < 3) return null
    return { average: values.reduce((sum, v) => sum + v, 0) / values.length, label: target }
  }

  return peersIn('subregion') ?? peersIn('region')
}

/**
 * Exact world rank, percentile, and regional-average comparison for a
 * country on a given layer. Distinct from tooltipContent.js's
 * getPercentileBadge, which reports a position on the color scale
 * (log-transformed, outlier-clipped) rather than a literal rank — the two
 * numbers are expected to differ slightly.
 *
 * @param {string} layerKey
 * @param {string} iso2
 * @param {object} storeSlices  { worldBankLayerCache, imfLayerCache, staticData, historicalData, activeYear, allCountriesData }
 * @returns {{layer: object, value: number, rank: number, total: number, percentile: number, regionAvg: number|null, regionLabel: string|null, deltaPct: number|null}|null}
 */
export function getCountryRanking(layerKey, iso2, storeSlices) {
  const layer = LAYERS[layerKey]
  // Numeric data layers only (same test as getNoDataMessage) — NOT
  // `layer.scale`, which gdp_per_capita omits by relying on the default.
  if (!layer || !(layer.indicator || layer.staticKey)) return null

  const { value } = getLayerValueForCountry(layerKey, iso2, storeSlices)
  if (value === null || value === undefined) return null

  const dataMap = getLayerDataMap(layerKey, storeSlices)
  const allValues = Object.values(dataMap).filter((v) => v !== null && v !== undefined)
  if (allValues.length < 5) return null

  const better = layer.invert
    ? allValues.filter((v) => v < value).length
    : allValues.filter((v) => v > value).length
  const total = allValues.length
  const rank = better + 1
  const percentile = Math.round((1 - better / total) * 100)

  const { allCountriesData } = storeSlices
  const iso2Map = layer.source === 'imf' ? toIso2Map(dataMap, allCountriesData) : dataMap
  const region = computeRegionAverage(iso2Map, allCountriesData, iso2)

  const deltaPct = region && region.average !== 0
    ? ((value - region.average) / Math.abs(region.average)) * 100
    : null

  return {
    layer,
    value,
    rank,
    total,
    percentile,
    regionAvg: region?.average ?? null,
    regionLabel: region?.label ?? null,
    deltaPct,
  }
}
