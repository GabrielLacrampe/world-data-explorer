const NO_DATA_COLOR = '#1e293b'

// Ten-stop gradient for data layers, from very low to very high.
const COLOR_SCALE = [
  '#0f172a',
  '#164e63',
  '#0369a1',
  '#0284c7',
  '#059669',
  '#65a30d',
  '#ca8a04',
  '#ea580c',
  '#dc2626',
  '#9f1239',
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
    lowerPercentile = 0.02,
    upperPercentile = 0.98,
  } = {}
) {
  if (!value || value <= 0) return NO_DATA_COLOR

  const values = Array.isArray(allValues)
    ? allValues.filter((v) => v && v > 0)
    : []

  if (values.length === 0) return NO_DATA_COLOR

  const transformedValues = values.map((v) => transformValue(v, scale))
  const transformedValue = transformValue(value, scale)
  const min = percentile(transformedValues, lowerPercentile)
  const max = percentile(transformedValues, upperPercentile)

  if (min === max) return gradient[Math.floor(gradient.length / 2)]

  const normalized = clamp((transformedValue - min) / (max - min), 0, 1)
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
 * Calculates quantiles from all values for even color distribution.
 */
export function calculateQuantiles(allValues, numBuckets = COLOR_SCALE.length) {
  const sorted = [...allValues].sort((a, b) => a - b)
  const quantiles = []
  
  for (let i = 1; i < numBuckets; i++) {
    const index = Math.floor((i / numBuckets) * sorted.length)
    quantiles.push(sorted[index])
  }
  
  return quantiles
}

/**
 * Generates the ranges for the map legend.
 */
export function getLegendRanges(min, max, steps = 5) {
  const logMin = Math.log(Math.max(min, 1))
  const logMax = Math.log(Math.max(max, 1))
  const step = (logMax - logMin) / steps

  return Array.from({ length: steps }, (_, i) => {
    const logValue = logMin + step * i
    return Math.round(Math.exp(logValue))
  })
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
