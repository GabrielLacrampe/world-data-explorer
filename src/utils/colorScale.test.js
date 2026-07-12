import { describe, it, expect } from 'vitest'
import {
  COLOR_SCALE,
  normalizeValue,
  valueToColor,
  combineNormalizedScores,
  buildMatchExpression,
  buildLayerExpression,
  buildPoliticalExpression,
  formatNumber,
} from './colorScale'

const NO_DATA_COLOR = '#1e293b'
const WORST = COLOR_SCALE[0]
const BEST = COLOR_SCALE[COLOR_SCALE.length - 1]

// Linear 1-100 spread: percentile clipping keeps min/max distinct and the
// extremes clamp cleanly to 0 and 1.
const SPREAD = Array.from({ length: 100 }, (_, i) => i + 1)

describe('normalizeValue', () => {
  it('returns null for null or undefined values', () => {
    expect(normalizeValue(null, SPREAD)).toBeNull()
    expect(normalizeValue(undefined, SPREAD)).toBeNull()
  })

  it('returns null for non-positive values on the (default) log scale', () => {
    expect(normalizeValue(0, SPREAD)).toBeNull()
    expect(normalizeValue(-5, SPREAD)).toBeNull()
  })

  it('accepts non-positive values on the linear scale', () => {
    const values = [-10, 0, 10]
    expect(normalizeValue(0, values, { scale: 'linear' })).not.toBeNull()
  })

  it('returns null when there are no usable reference values', () => {
    expect(normalizeValue(5, [])).toBeNull()
    expect(normalizeValue(5, [null, undefined])).toBeNull()
  })

  it('returns 0.5 when every reference value is identical', () => {
    expect(normalizeValue(7, [7, 7, 7])).toBe(0.5)
  })

  it('maps the minimum to 0 and the maximum to 1', () => {
    expect(normalizeValue(1, SPREAD, { scale: 'linear' })).toBe(0)
    expect(normalizeValue(100, SPREAD, { scale: 'linear' })).toBe(1)
  })

  it('clamps outliers beyond the 2/98 percentile window', () => {
    const withOutlier = [...SPREAD, 1_000_000]
    expect(normalizeValue(1_000_000, withOutlier, { scale: 'linear' })).toBe(1)
  })

  it('invert flips the score', () => {
    const normal = normalizeValue(30, SPREAD, { scale: 'linear' })
    const inverted = normalizeValue(30, SPREAD, { scale: 'linear', invert: true })
    expect(inverted).toBeCloseTo(1 - normal)
  })

  it('log scale compresses high values compared to linear', () => {
    const log = normalizeValue(50, SPREAD, { scale: 'log' })
    const linear = normalizeValue(50, SPREAD, { scale: 'linear' })
    expect(log).toBeGreaterThan(linear)
  })
})

describe('valueToColor', () => {
  it('returns the no-data color for null values', () => {
    expect(valueToColor(null, SPREAD)).toBe(NO_DATA_COLOR)
  })

  it('maps the extremes to the ends of the gradient', () => {
    expect(valueToColor(1, SPREAD, { scale: 'linear' })).toBe(WORST)
    expect(valueToColor(100, SPREAD, { scale: 'linear' })).toBe(BEST)
  })

  it('invert swaps which extreme is "best"', () => {
    expect(valueToColor(1, SPREAD, { scale: 'linear', invert: true })).toBe(BEST)
    expect(valueToColor(100, SPREAD, { scale: 'linear', invert: true })).toBe(WORST)
  })

  it('returns a valid hex color for mid-range values', () => {
    expect(valueToColor(50, SPREAD, { scale: 'linear' })).toMatch(/^#[0-9a-f]{6}$/)
  })
})

describe('combineNormalizedScores', () => {
  it('returns null when every score is null', () => {
    expect(combineNormalizedScores([null, null])).toBeNull()
    expect(combineNormalizedScores([])).toBeNull()
  })

  it('skips null scores instead of dragging the average down', () => {
    expect(combineNormalizedScores([0.5, null])).toBe(combineNormalizedScores([0.5]))
  })

  it('averages the scores', () => {
    expect(combineNormalizedScores([0, 1])).toBe(combineNormalizedScores([0.5]))
  })

  it('maps 0 and 1 to the gradient ends', () => {
    expect(combineNormalizedScores([0])).toBe(WORST)
    expect(combineNormalizedScores([1])).toBe(BEST)
  })
})

describe('buildMatchExpression', () => {
  it('builds a MapLibre match expression on the ISO2 property', () => {
    const expr = buildMatchExpression({ ES: '#ff0000', DE: '#00ff00' })
    expect(expr).toEqual([
      'match', ['get', 'ISO3166-1-Alpha-2'],
      'ES', '#ff0000',
      'DE', '#00ff00',
      NO_DATA_COLOR,
    ])
  })

  it('honors a custom fallback color', () => {
    const expr = buildMatchExpression({}, '#123456')
    expect(expr[expr.length - 1]).toBe('#123456')
  })
})

describe('buildLayerExpression', () => {
  const data = Object.fromEntries(SPREAD.map((v, i) => [`C${i}`, v]))

  it('returns null when there is nothing paintable', () => {
    expect(buildLayerExpression({})).toBeNull()
    expect(buildLayerExpression({ ES: null })).toBeNull()
    // log scale discards non-positive values
    expect(buildLayerExpression({ ES: 0, DE: -3 })).toBeNull()
  })

  it('colors each country and keeps the extremes at the gradient ends', () => {
    const expr = buildLayerExpression(data, { scale: 'linear' })
    const colorOf = (code) => expr[expr.indexOf(code) + 1]
    expect(expr[0]).toBe('match')
    expect(colorOf('C0')).toBe(WORST)   // value 1
    expect(colorOf('C99')).toBe(BEST)   // value 100
  })

  it('respects the layer invert flag', () => {
    const expr = buildLayerExpression(data, { scale: 'linear', invert: true })
    const colorOf = (code) => expr[expr.indexOf(code) + 1]
    expect(colorOf('C0')).toBe(BEST)
    expect(colorOf('C99')).toBe(WORST)
  })

  it('paints countries with null values in the no-data color', () => {
    const expr = buildLayerExpression({ ...data, XX: null }, { scale: 'linear' })
    expect(expr[expr.indexOf('XX') + 1]).toBe(NO_DATA_COLOR)
  })

  it('accepts a LAYERS entry directly, defaulting scale and invert', () => {
    const layer = { label: 'Population', indicator: 'SP.POP.TOTL', unit: 'people' }
    const expr = buildLayerExpression(data, layer)
    expect(expr[0]).toBe('match')
  })
})

describe('buildPoliticalExpression', () => {
  it('blends non-country features (-99) with the background', () => {
    const expr = buildPoliticalExpression(['-99', 'FR'])
    expect(expr[expr.indexOf('-99') + 1]).toBe('#0a0e1a')
  })

  it('assigns every requested code a color', () => {
    const expr = buildPoliticalExpression(['FR', 'ZZ'])
    expect(expr[expr.indexOf('FR') + 1]).toMatch(/^#[0-9a-f]{6}$/i)
    expect(expr[expr.indexOf('ZZ') + 1]).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('formatNumber', () => {
  it('formats with magnitude suffixes', () => {
    expect(formatNumber(25_000_000_000_000)).toBe('25.0T')
    expect(formatNumber(1_400_000_000)).toBe('1.4B')
    expect(formatNumber(17_000_000)).toBe('17.0M')
    expect(formatNumber(800_000)).toBe('800K')
    expect(formatNumber(950)).toBe('950')
  })
})
