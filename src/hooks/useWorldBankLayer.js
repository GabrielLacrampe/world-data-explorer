import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { LAYERS } from '../layers'
import { fetchIndicatorAllCountries, fetchIndicatorForCountries } from '../utils/worldBank'
import { getDataset, wbKey } from '../lib/datasets'
import { buildLayerExpression } from '../utils/colorScale'

const DEBOUNCE_MS = 150

const HIGH_LITERACY_SUBREGIONS = new Set([
  'Northern Europe', 'Southern Europe', 'Western Europe', 'Eastern Europe',
  'Northern America', 'Australia and New Zealand',
])
const HIGH_LITERACY_EXTRA = new Set(['JP', 'KR', 'SG', 'TW'])

export default function useWorldBankLayer() {
  const activeLayer           = useStore((s) => s.activeLayer)
  const combineMode           = useStore((s) => s.combineMode)
  const allCountriesData      = useStore((s) => s.allCountriesData)
  const worldBankLayerCache   = useStore((s) => s.worldBankLayerCache)
  const setWorldBankLayerData = useStore((s) => s.setWorldBankLayerData)
  const setFillExpression     = useStore((s) => s.setFillExpression)
  const setLastError          = useStore((s) => s.setLastError)
  const setLayerLoading       = useStore((s) => s.setLayerLoading)

  const timerRef = useRef(null)

  useEffect(() => {
    if (combineMode) return  // handled by useCombinedLayer
    const layer = LAYERS[activeLayer]
    if (layer.source !== 'worldbank') return
    if (layer.historical) return  // handled by useHistoricalLayer

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

      const expression = buildLayerExpression(data, layer)
      if (expression) setFillExpression(expression)
    }

    if (worldBankLayerCache[indicator]) {
      buildExpression(worldBankLayerCache[indicator])
      return
    }

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLayerLoading(true)
      try {
        const data = {
          ...(await getDataset(wbKey(indicator), () =>
            fetchIndicatorAllCountries(indicator, { mrv: layer.mrv })
          )),
        }
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
      } finally {
        if (!cancelled) setLayerLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer, allCountriesData, combineMode])
}
