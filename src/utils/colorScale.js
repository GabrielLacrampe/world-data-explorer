const NO_DATA_COLOR = '#1e293b'

// 16-stop gradient: red (worst) → yellow (mid) → green (best)
export const COLOR_SCALE = [
  '#b91c1c',
  '#c62020',
  '#d32424',
  '#dc2626',
  '#e44015',
  '#ea580c',
  '#f97316',
  '#fb923c',
  '#fbbf24',
  '#facc15',
  '#d4f018',
  '#a3e635',
  '#84cc16',
  '#4ade80',
  '#22c55e',
  '#16a34a',
]

/**
 * Normalizes a value to a 0-1 score using percentile-clipped min/max
 * (reduces outlier distortion) and logarithmic scaling by default.
 * Returns null when there is no usable data for this value.
 */
export function normalizeValue(
  value,
  allValues,
  {
    scale = 'log',
    invert = false,
    lowerPercentile = 0.02,
    upperPercentile = 0.98,
  } = {}
) {
  if (value === null || value === undefined) return null
  if (scale === 'log' && value <= 0) return null

  const values = Array.isArray(allValues)
    ? allValues.filter((v) => v !== null && v !== undefined && (scale === 'log' ? v > 0 : true))
    : []

  if (values.length === 0) return null

  const transformedValues = values.map((v) => transformValue(v, scale))
  const transformedValue = transformValue(value, scale)
  const min = percentile(transformedValues, lowerPercentile)
  const max = percentile(transformedValues, upperPercentile)

  if (min === max) return 0.5

  let normalized = clamp((transformedValue - min) / (max - min), 0, 1)
  if (invert) normalized = 1 - normalized
  return normalized
}

/**
 * Transforms a value into a gradient color.
 * Uses percentile clipping to reduce outlier distortion and logarithmic scaling
 * by default, which works well for country-level population and area values.
 */
export function valueToColor(
  value,
  allValues,
  {
    gradient = COLOR_SCALE,
    scale = 'log',
    invert = false,
    lowerPercentile = 0.02,
    upperPercentile = 0.98,
  } = {}
) {
  const normalized = normalizeValue(value, allValues, { scale, invert, lowerPercentile, upperPercentile })
  if (normalized === null) return NO_DATA_COLOR
  return interpolateGradient(gradient, normalized)
}

/**
 * Averages several per-layer normalized (0-1) scores for the same country
 * into one blended color. Layers with no data for this country are skipped.
 * Returns null if none of the layers have data.
 */
export function combineNormalizedScores(scores, gradient = COLOR_SCALE) {
  const valid = scores.filter((s) => s !== null && s !== undefined)
  if (valid.length === 0) return null
  const avg = valid.reduce((sum, s) => sum + s, 0) / valid.length
  return interpolateGradient(gradient, avg)
}

function transformValue(value, scale) {
  if (scale === 'log') return Math.log(Math.max(value, 1))
  return value
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b)
  const index = clamp(percentileValue, 0, 1) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) return sorted[lower]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

function interpolateGradient(gradient, normalizedValue) {
  const scaled = clamp(normalizedValue, 0, 1) * (gradient.length - 1)
  const lower = Math.floor(scaled)
  const upper = Math.ceil(scaled)
  const weight = scaled - lower

  if (lower === upper) return gradient[lower]
  return mixColors(gradient[lower], gradient[upper], weight)
}

function mixColors(fromHex, toHex, weight) {
  const from = hexToRgb(fromHex)
  const to = hexToRgb(toHex)
  const mixed = from.map((channel, index) =>
    Math.round(channel * (1 - weight) + to[index] * weight)
  )

  return rgbToHex(mixed)
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function rgbToHex(rgb) {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

import { EU4_COLORS, EU4_MISSING_COLOR } from '../config/eu4Colors'

/**
 * Builds a MapLibre match expression using EU4 country colors.
 * Countries without a known EU4 color render as EU4_MISSING_COLOR.
 */
export function buildPoliticalExpression(iso2Codes) {
  const colors = {}
  iso2Codes.forEach((code) => {
    // -99 = non-country features (lakes, disputed areas) — blend with background
    colors[code] = code === '-99' ? '#0a0e1a' : (EU4_COLORS[code] ?? EU4_MISSING_COLOR)
  })
  return buildMatchExpression(colors, '#0a0e1a')
}

/**
 * Full color pipeline for a data layer: filters usable values, colors each
 * country, and returns the MapLibre fill expression — or null when the
 * dataset has nothing paintable. The options object only needs the optional
 * `scale` and `invert` fields, so callers can pass their LAYERS entry
 * directly. Shared by the World Bank, IMF, historical and static sources.
 */
export function buildLayerExpression(data, { scale = 'log', invert = false } = {}) {
  const values = Object.values(data).filter(
    (v) => v !== null && v !== undefined && (scale === 'log' ? v > 0 : true)
  )
  if (values.length === 0) return null

  const countryColors = {}
  Object.entries(data).forEach(([code, value]) => {
    countryColors[code] = valueToColor(value, values, { scale, invert })
  })
  return buildMatchExpression(countryColors)
}

/**
 * Builds a MapLibre 'match' expression that maps ISO codes to colors.
 * countryColors is an object: { 'NL': '#ff0000', 'DE': '#00ff00', ... }
 * fallbackColor is used for countries with no data.
 */
export function buildMatchExpression(countryColors, fallbackColor = '#1e293b') {
  const expression = ['match', ['get', 'ISO3166-1-Alpha-2']]

  Object.entries(countryColors).forEach(([isoCode, color]) => {
    expression.push(isoCode, color)
  })

  expression.push(fallbackColor) // fallback
  return expression
}
