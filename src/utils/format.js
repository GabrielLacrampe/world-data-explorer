// All number formatting for display lives here. One core helper
// (formatNumber) handles magnitude suffixes; the rest are thin wrappers
// that encode each stat's display conventions.

/**
 * Formats large numbers into human-readable strings with suffixes (K, M, B, T).
 * 25000000000000 → "25.0T" | 1400000000 → "1.4B" | 800000 → "800K"
 * `decimals` applies to the M/B/T tiers; the K tier always rounds.
 *
 * @param {number|null|undefined} n
 * @param {{prefix?: string, decimals?: number}} [options]
 * @returns {string|null}
 */
export function formatNumber(n, { prefix = '', decimals = 1 } = {}) {
  if (n === null || n === undefined) return null
  if (n >= 1_000_000_000_000) return `${prefix}${(n / 1_000_000_000_000).toFixed(decimals)}T`
  if (n >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(decimals)}B`
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(decimals)}M`
  if (n >= 1_000) return `${prefix}${Math.round(n / 1_000)}K`
  return `${prefix}${n}`
}

/** GDP per capita for the TopBar: whole dollars, "$52K" style. */
export function fmtGdpCap(v) {
  if (v == null) return null
  return formatNumber(Math.round(v), { prefix: '$' })
}

/** Population for the TopBar: 2 decimals at the billions tier ("1.42B"). */
export function fmtPop(v) {
  if (v == null) return null
  return formatNumber(v, { decimals: v >= 1_000_000_000 ? 2 : 1 })
}

/** SIPRI military spending, which comes in millions of USD. */
export function formatMilSpending(millionsUSD) {
  if (!millionsUSD) return 'No data'
  if (millionsUSD >= 1_000) return formatNumber(millionsUSD * 1_000_000, { prefix: '$' })
  return `$${millionsUSD.toLocaleString('en-US')}M`
}

/**
 * Formats a World Bank value for display in the sidebar,
 * according to the layer's declared `format` and `unit`.
 *
 * @param {number|null|undefined} value
 * @param {'currency'|'percent'|'decimal'|'integer'} [format]
 * @param {string} [unit]
 * @returns {string}
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
