import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchImfIndicatorLatest } from './imf'

// Minimal but faithful SDMX 2.1 jsondata payload: series keys are
// colon-separated dimension indices ('freq:country'), observations are
// keyed by time index into structure.dimensions.observation[0].values.
const sdmxPayload = {
  structure: {
    dimensions: {
      series: [
        { id: 'FREQ', keyPosition: 0, values: [{ id: 'A' }] },
        { id: 'COUNTRY', keyPosition: 1, values: [{ id: 'ESP' }, { id: 'ARG' }, { id: 'FRA' }] },
      ],
      observation: [
        { values: [{ id: '2019' }, { id: '2020' }, { id: '2021' }] },
      ],
    },
  },
  dataSets: [
    {
      series: {
        // ESP: values for 2019, 2021 and 2020 (deliberately out of order)
        '0:0': { observations: { 0: [50.1], 2: [60.5], 1: [55.2] } },
        // ARG: only unusable observations (null and non-numeric)
        '0:1': { observations: { 0: [null], 1: ['not-a-number'] } },
        // FRA: no observations at all
        '0:2': { observations: {} },
      },
    },
  ],
}

function mockFetch(payload, { ok = true, status = 200 } = {}) {
  const fetchMock = vi.fn(async () => ({ ok, status, json: async () => payload }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchImfIndicatorLatest', () => {
  it('returns the most recent value per country, keyed by ISO3', async () => {
    mockFetch(sdmxPayload)
    const result = await fetchImfIndicatorLatest('FL_S13_POGDP_PT')
    expect(result).toEqual({ ESP: 60.5 })
  })

  it('skips countries whose observations are all null or non-numeric', async () => {
    mockFetch(sdmxPayload)
    const result = await fetchImfIndicatorLatest('FL_S13_POGDP_PT')
    expect(result).not.toHaveProperty('ARG')
    expect(result).not.toHaveProperty('FRA')
  })

  it('requests the expected SDMX URL', async () => {
    const fetchMock = mockFetch(sdmxPayload)
    await fetchImfIndicatorLatest('FL_S13_POGDP_PT')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.imf.org/external/sdmx/2.1/data/GDD/.FL_S13_POGDP_PT.A?startPeriod=2015&format=jsondata',
      { headers: { Accept: 'application/json' } }
    )
  })

  it('honors dataflow, freq and startPeriod overrides', async () => {
    const fetchMock = mockFetch(sdmxPayload)
    await fetchImfIndicatorLatest('GGXCNL_G01_GDP_PT', { dataflow: 'FM', freq: 'Q', startPeriod: '2020' })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/FM/.GGXCNL_G01_GDP_PT.Q?startPeriod=2020'),
      expect.anything()
    )
  })

  it('throws on an HTTP error response', async () => {
    mockFetch(null, { ok: false, status: 503 })
    await expect(fetchImfIndicatorLatest('X')).rejects.toThrow('IMF API error: 503')
  })

  it('returns an empty object when the COUNTRY dimension is missing', async () => {
    mockFetch({ structure: { dimensions: { series: [] } }, dataSets: [] })
    await expect(fetchImfIndicatorLatest('X')).resolves.toEqual({})
  })
})
