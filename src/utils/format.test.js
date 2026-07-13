import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  fmtGdpCap,
  fmtPop,
  formatMilSpending,
  formatIndicatorValue,
} from './format'

describe('formatNumber', () => {
  it('formats with magnitude suffixes', () => {
    expect(formatNumber(25_000_000_000_000)).toBe('25.0T')
    expect(formatNumber(1_400_000_000)).toBe('1.4B')
    expect(formatNumber(17_000_000)).toBe('17.0M')
    expect(formatNumber(800_000)).toBe('800K')
    expect(formatNumber(950)).toBe('950')
  })

  it('supports a prefix and custom decimals', () => {
    expect(formatNumber(1_500_000_000, { prefix: '$' })).toBe('$1.5B')
    expect(formatNumber(1_426_000_000, { decimals: 2 })).toBe('1.43B')
  })

  it('returns null for null or undefined', () => {
    expect(formatNumber(null)).toBeNull()
    expect(formatNumber(undefined)).toBeNull()
  })
})

describe('fmtGdpCap', () => {
  it('formats whole dollars with magnitude suffixes', () => {
    expect(fmtGdpCap(52_345)).toBe('$52K')
    expect(fmtGdpCap(1_200_000)).toBe('$1.2M')
    expect(fmtGdpCap(850.7)).toBe('$851')
  })

  it('returns null for missing values', () => {
    expect(fmtGdpCap(null)).toBeNull()
  })
})

describe('fmtPop', () => {
  it('uses 2 decimals at the billions tier and 1 below', () => {
    expect(fmtPop(1_425_000_000)).toBe('1.43B')
    expect(fmtPop(47_500_000)).toBe('47.5M')
    expect(fmtPop(5_200)).toBe('5K')
    expect(fmtPop(500)).toBe('500')
  })

  it('returns null for missing values', () => {
    expect(fmtPop(null)).toBeNull()
  })
})

describe('formatMilSpending', () => {
  it('converts from millions of USD', () => {
    expect(formatMilSpending(1_500)).toBe('$1.5B')
    expect(formatMilSpending(876.4)).toBe('$876.4M')
  })

  it('returns "No data" for missing values', () => {
    expect(formatMilSpending(null)).toBe('No data')
    expect(formatMilSpending(0)).toBe('No data')
  })
})

describe('formatIndicatorValue', () => {
  it('formats according to the layer format type', () => {
    expect(formatIndicatorValue(52_000, 'currency', 'USD')).toBe('$52,000 USD')
    expect(formatIndicatorValue(3.84, 'percent')).toBe('3.8%')
    expect(formatIndicatorValue(72.46, 'decimal', 'years')).toBe('72.5 years')
    expect(formatIndicatorValue(42, undefined, 'items')).toBe('42 items')
  })

  it('returns "No data" for null or undefined', () => {
    expect(formatIndicatorValue(null, 'percent')).toBe('No data')
    expect(formatIndicatorValue(undefined, 'currency', 'USD')).toBe('No data')
  })
})
