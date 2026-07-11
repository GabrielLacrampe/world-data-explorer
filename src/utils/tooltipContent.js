import { LAYERS, TOOLTIP_AUX_INDICATORS, isCombinableLayer } from '../layers'
import { formatIndicatorValue } from './worldBank'
import { formatNumber, normalizeValue } from './colorScale'

/**
 * Layers with a `historical` config (gdp_per_capita, population,
 * life_expectancy) are ALWAYS driven by the time slider once selected —
 * useWorldBankLayer.js skips them entirely and useHistoricalLayer.js takes
 * over, snapping `activeYear` to the closest year with OWID data. The map's
 * actual fill color comes from `historicalData`, not `worldBankLayerCache`,
 * so tooltips must read from the same place using the same year-snapping
 * logic (mirrors useHistoricalLayer.js's own snapping, lines ~58-64).
 */
function getHistoricalYearData(layer, storeSlices) {
  const { historicalData, activeYear } = storeSlices
  const { owidChart, yearRange, defaultYear } = layer.historical
  const chartData = historicalData?.[owidChart]
  if (!chartData) return null

  const targetYear = activeYear ?? defaultYear
  const [minYear, maxYear] = yearRange
  const years = Object.keys(chartData).map(Number).filter((y) => y >= minYear && y <= maxYear)
  if (years.length === 0) return null

  const closest = years.reduce((prev, curr) =>
    Math.abs(curr - targetYear) < Math.abs(prev - targetYear) ? curr : prev
  )
  return chartData[closest] ?? null
}

/**
 * Resolves the raw value for a given layer + country (ISO2), regardless of
 * the layer's underlying source (worldbank/imf/static/historical). This
 * mirrors the lookup each *Layer hook already does when building the map
 * fill color, just without discarding the raw number.
 */
export function getLayerValueForCountry(layerKey, iso2, storeSlices) {
  const { worldBankLayerCache, imfLayerCache, staticData, allCountriesData } = storeSlices
  const layer = LAYERS[layerKey]
  if (!layer) return { value: null, source: null }

  if (layer.historical) {
    const yearData = getHistoricalYearData(layer, storeSlices)
    return { value: yearData?.[iso2] ?? null, source: layer.source }
  }
  if (layer.source === 'worldbank') {
    return { value: worldBankLayerCache[layer.indicator]?.[iso2] ?? null, source: 'worldbank' }
  }
  if (layer.source === 'imf') {
    const iso3 = allCountriesData?.[iso2]?.cca3
    const value = iso3 ? imfLayerCache[layer.indicator]?.[iso3] ?? null : null
    return { value, source: 'imf' }
  }
  if (layer.source === 'static' && layer.staticKey) {
    return { value: staticData?.[layer.staticKey]?.[iso2] ?? null, source: 'static' }
  }
  return { value: null, source: layer.source ?? null }
}

function getAllValuesForLayer(layerKey, storeSlices) {
  const { worldBankLayerCache, imfLayerCache, staticData } = storeSlices
  const layer = LAYERS[layerKey]
  if (!layer) return []
  if (layer.historical) return Object.values(getHistoricalYearData(layer, storeSlices) ?? {})
  if (layer.source === 'worldbank') return Object.values(worldBankLayerCache[layer.indicator] ?? {})
  if (layer.source === 'imf') return Object.values(imfLayerCache[layer.indicator] ?? {})
  if (layer.source === 'static' && layer.staticKey) return Object.values(staticData?.[layer.staticKey] ?? {})
  return []
}

/**
 * Formats a raw value for tooltip display. Wraps formatIndicatorValue but
 * fixes the `format: 'integer'` gap (no thousands separator / no K-M-B-T
 * suffix for large numbers like population or CO2 emissions).
 */
export function formatTooltipValue(value, format, unit) {
  if (value === null || value === undefined) return 'No data'
  if (format === 'integer') {
    const formatted = Math.abs(value) >= 10_000 ? formatNumber(value) : Number(value).toLocaleString('en-US')
    return unit ? `${formatted} ${unit}` : formatted
  }
  return formatIndicatorValue(value, format, unit)
}

/**
 * "≈ Top 15% globally" style badge, reusing the exact normalization
 * (percentile-clipped, log/linear, invert-aware) already used to color the
 * map for this layer — so the badge always agrees with what the user sees.
 */
export function getPercentileBadge(layerKey, iso2, storeSlices) {
  const layer = LAYERS[layerKey]
  if (!layer?.scale) return null

  const { value } = getLayerValueForCountry(layerKey, iso2, storeSlices)
  if (value === null) return null

  const allValues = getAllValuesForLayer(layerKey, storeSlices)
  if (allValues.length < 5) return null

  const normalized = normalizeValue(value, allValues, { scale: layer.scale, invert: layer.invert ?? false })
  if (normalized === null) return null

  const topPct = Math.round((1 - normalized) * 100)
  if (topPct <= 1) return { label: '≈ Top 1% globally' }
  if (topPct >= 99) return { label: '≈ Bottom 1% globally' }
  if (topPct <= 50) return { label: `≈ Top ${topPct}% globally` }
  return { label: `≈ Bottom ${100 - topPct}% globally` }
}

/**
 * Explicit "no data" message for the currently active single layer, distinct
 * from "still loading" (callers must check the global layerLoading flag
 * first so a fetch-in-flight never flashes a false no-data message).
 */
export function getNoDataMessage(layerKey, iso2, storeSlices) {
  const layer = LAYERS[layerKey]
  if (!layer || !(layer.indicator || layer.staticKey)) return null
  const { value } = getLayerValueForCountry(layerKey, iso2, storeSlices)
  if (value !== null) return null
  return `No ${layer.label} data available for this country.`
}

/**
 * Real math breakdown for layers that declare `breakdown` in layers.js.
 * Returns null when the layer has no breakdown config, or when there's no
 * headline value to break down in the first place. Otherwise returns
 * { status: 'ready' | 'loading', lines: string[] } — 'loading' means the
 * auxiliary indicator(s) (Total GDP / Population) haven't been fetched yet;
 * `density` never triggers a fetch, so it simply returns null until the
 * user happens to have Population/Area already cached from another layer.
 */
export function getBreakdown(layerKey, iso2, storeSlices) {
  const layer = LAYERS[layerKey]
  const breakdown = layer?.breakdown
  if (!breakdown) return null

  const { value: rawValue } = getLayerValueForCountry(layerKey, iso2, storeSlices)
  if (rawValue === null) return null

  const { worldBankLayerCache } = storeSlices
  const gdp = worldBankLayerCache[TOOLTIP_AUX_INDICATORS.TOTAL_GDP]?.[iso2] ?? null
  const population = worldBankLayerCache[TOOLTIP_AUX_INDICATORS.POPULATION]?.[iso2] ?? null
  const area = worldBankLayerCache[TOOLTIP_AUX_INDICATORS.AREA]?.[iso2] ?? null

  switch (breakdown.type) {
    case 'percentOfGdp': {
      if (gdp === null) return { status: 'loading', lines: [] }
      const absolute = (rawValue / 100) * gdp
      return {
        status: 'ready',
        lines: [`${rawValue.toFixed(1)}% × ${formatNumber(gdp)} GDP ≈ $${formatNumber(absolute)}`],
      }
    }
    case 'gdpPerCapitaCrossCheck': {
      if (gdp === null || population === null) return { status: 'loading', lines: [] }
      const computed = gdp / population
      const delta = rawValue !== 0 ? Math.abs(computed - rawValue) / rawValue : 0
      const deltaNote = delta > 0.02 ? ' (sources/vintages differ slightly)' : ''
      return {
        status: 'ready',
        lines: [
          `Total GDP ÷ Population = ${formatNumber(gdp)} ÷ ${formatNumber(population)} ≈ $${Math.round(computed).toLocaleString('en-US')}`,
          `Published GDP per Capita: $${Math.round(rawValue).toLocaleString('en-US')}${deltaNote}`,
        ],
      }
    }
    case 'rateOfPopulation': {
      if (population === null) return { status: 'loading', lines: [] }
      const absolute = (rawValue / 1000) * population
      return {
        status: 'ready',
        lines: [`${rawValue.toFixed(1)} / 1,000 × ${formatNumber(population)} people ≈ ${formatNumber(absolute)} ${breakdown.resultUnit}`],
      }
    }
    case 'shareOfPopulation': {
      if (population === null) return { status: 'loading', lines: [] }
      const pct = (rawValue / population) * 100
      return {
        status: 'ready',
        lines: [`${formatNumber(rawValue)} ÷ ${formatNumber(population)} population ≈ ${pct.toFixed(3)}% of population`],
      }
    }
    case 'density': {
      if (population === null || area === null) return null
      const density = population / area
      return {
        status: 'ready',
        lines: [`Population ÷ Area = ${formatNumber(population)} ÷ ${formatNumber(area)} km² ≈ ${density.toFixed(1)} people/km²`],
      }
    }
    default:
      return null
  }
}

/**
 * Per-sub-layer raw values for the hovered country in combine mode — shows
 * what's actually feeding the blended score, not just the final color.
 */
export function getCombineModeBreakdown(combinedLayers, iso2, storeSlices) {
  return combinedLayers.filter(isCombinableLayer).map((key) => {
    const layer = LAYERS[key]
    const { value } = getLayerValueForCountry(key, iso2, storeSlices)
    return {
      key,
      label: layer.label,
      formatted: formatTooltipValue(value, layer.format, layer.unit),
      hasData: value !== null,
    }
  })
}
