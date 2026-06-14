import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { LAYERS } from '../layers'
import { fetchIndicatorAllCountries, fetchIndicatorForCountries } from '../utils/worldBank'
import { buildMatchExpression, valueToColor } from '../utils/colorScale'

const DEBOUNCE_MS = 150

const HIGH_LITERACY_SUBREGIONS = new Set([
  'Northern Europe', 'Southern Europe', 'Western Europe', 'Eastern Europe',
  'Northern America', 'Australia and New Zealand',
])
const HIGH_LITERACY_EXTRA = new Set(['JP', 'KR', 'SG', 'TW'])

export default function useWorldBankLayer() {
  const {
    activeLayer,
    allCountriesData,
    worldBankLayerCache,
    setWorldBankLayerData,
    setFillExpression,
    setLastError,
  } = useStore()

  const timerRef = useRef(null)

  useEffect(() => {
    const layer = LAYERS[activeLayer]
    if (layer.source !== 'worldbank') return

    const indicator = layer.indicator
    let cancelled = false

    const buildExpression = (rawData) => {
      const data = { ...rawData }
      if (layer.fallback !== undefined && allCountriesData) {
        Object.entries(allCountriesData).forEach(([iso2, country]) => {
          if (iso2 in data) return
          if (HIGH_LITERACY_SUBREGIONS.has(country.subregion) || HIGH_LITERACY_EXTRA.has(iso2)) {
            data[iso2] = layer.fallback
          }
        })
      }

      const scale  = layer.scale  ?? 'log'
      const invert = layer.invert ?? false
      const values = Object.values(data).filter(
        (v) => v !== null && v !== undefined && (scale === 'log' ? v > 0 : true)
      )
      if (values.length === 0) return

      const countryColors = {}
      Object.entries(data).forEach(([code, value]) => {
        countryColors[code] = valueToColor(value, values, { scale, invert })
      })
      setFillExpression(buildMatchExpression(countryColors))
    }

    if (worldBankLayerCache[indicator]) {
      buildExpression(worldBankLayerCache[indicator])
      return
    }

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const data = await fetchIndicatorAllCountries(indicator, { mrv: layer.mrv })
        if (cancelled) return

        if (layer.supplementalFetch && allCountriesData) {
          const missing = Object.keys(allCountriesData).filter((iso2) => !(iso2 in data))
          if (missing.length) {
            const extra = await fetchIndicatorForCountries(missing, indicator, { mrv: layer.mrv })
            if (!cancelled) Object.assign(data, extra)
          }
        }

        if (cancelled) return
        setWorldBankLayerData(indicator, data)
        buildExpression(data)
      } catch (err) {
        if (cancelled) return
        console.error('World Bank layer fetch failed:', err)
        setLastError(`Failed to load layer data: ${err.message}`)
        setFillExpression('#3b5998')
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
    }
  }, [activeLayer, allCountriesData])
}
