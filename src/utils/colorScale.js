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
  if (value === null || value === undefined) return NO_DATA_COLOR
  if (scale === 'log' && value <= 0) return NO_DATA_COLOR

  const values = Array.isArray(allValues)
    ? allValues.filter((v) => v !== null && v !== undefined && (scale === 'log' ? v > 0 : true))
    : []

  if (values.length === 0) return NO_DATA_COLOR

  const transformedValues = values.map((v) => transformValue(v, scale))
  const transformedValue = transformValue(value, scale)
  const min = percentile(transformedValues, lowerPercentile)
  const max = percentile(transformedValues, upperPercentile)

  if (min === max) return gradient[Math.floor(gradient.length / 2)]

  let normalized = clamp((transformedValue - min) / (max - min), 0, 1)
  if (invert) normalized = 1 - normalized
  return interpolateGradient(gradient, normalized)
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

/**
 * Formats large numbers into human-readable strings with suffixes (K, M, B).
 * 1400000000 → "1.4B" | 17000000 → "17M" | 800000 → "800K"
 */
export function formatNumber(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
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
