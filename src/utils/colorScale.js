// Colour pallete inspired by Tailwind CSS: https://tailwindcss.com/docs/customizing-colors#color-palette-reference
const COLOR_SCALE = [
  '#e0f2fe', // very low
  '#7dd3fc',
  '#38bdf8',
  '#0284c7',
  '#0369a1',
  '#1d4ed8',
  '#7c3aed',
  '#9f1239', // very high
]

/**
 * Transforms a value (e.g. population) into a color from the scale.
 * Uses quantile-based bucketing for better color distribution across outliers.
 */
export function valueToColor(value, min, max, quantiles = null) {
  if (!value || value <= 0) return '#1e293b' // no data: dark gray

  // If no quantiles provided, use logarithmic scaling
  if (!quantiles) {
    const logValue = Math.log(value)
    const logMin = Math.log(Math.max(min, 1))
    const logMax = Math.log(Math.max(max, 1))

    const normalized = (logValue - logMin) / (logMax - logMin)
    const clamped = Math.max(0, Math.min(1, normalized))

    const index = Math.floor(clamped * (COLOR_SCALE.length - 1))
    return COLOR_SCALE[index]
  }

  // Quantile-based: find which bucket the value falls into
  for (let i = 0; i < quantiles.length; i++) {
    if (value <= quantiles[i]) {
      return COLOR_SCALE[i]
    }
  }
  return COLOR_SCALE[COLOR_SCALE.length - 1]
}

/**
 * Calculates quantiles from all values for even color distribution.
 */
export function calculateQuantiles(allValues, numBuckets = COLOR_SCALE.length) {
  const sorted = allValues.sort((a, b) => a - b)
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