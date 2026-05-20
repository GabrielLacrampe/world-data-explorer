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
 * Uses logarithms to handle very wide ranges (e.g. population).
 */
export function valueToColor(value, min, max) {
  if (!value || value <= 0) return '#1e293b' // no data: dark gray

  const logValue = Math.log(value)
  const logMin = Math.log(Math.max(min, 1))
  const logMax = Math.log(Math.max(max, 1))

  // Normalizes between 0 and 1
  const normalized = (logValue - logMin) / (logMax - logMin)
  const clamped = Math.max(0, Math.min(1, normalized))

  // Selects the corresponding color from the scale
  const index = Math.floor(clamped * (COLOR_SCALE.length - 1))
  return COLOR_SCALE[index]
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