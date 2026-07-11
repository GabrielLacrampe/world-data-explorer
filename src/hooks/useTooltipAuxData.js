import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { LAYERS, TOOLTIP_AUX_INDICATORS } from '../layers'
import { fetchIndicatorAllCountries } from '../utils/worldBank'

const DEBOUNCE_MS = 150

// Which auxiliary indicators a breakdown type needs fetched (all-countries,
// same as any other layer) before it can compute real numbers. `density`
// has no entry — it only reads Population/Area if another layer already
// cached them, it never triggers a fetch of its own.
const NEEDED_INDICATORS = {
  percentOfGdp: [TOOLTIP_AUX_INDICATORS.TOTAL_GDP],
  gdpPerCapitaCrossCheck: [TOOLTIP_AUX_INDICATORS.TOTAL_GDP, TOOLTIP_AUX_INDICATORS.POPULATION],
  rateOfPopulation: [TOOLTIP_AUX_INDICATORS.POPULATION],
  shareOfPopulation: [TOOLTIP_AUX_INDICATORS.POPULATION],
}

/**
 * Lazily fetches whatever auxiliary indicator(s) the active layer's
 * breakdown needs (Total GDP / Population), only once a hover actually
 * requires them, and caches them into the same worldBankLayerCache every
 * other layer uses — so repeated hovers across many countries never
 * re-fetch, and visiting the Population/Total GDP layers directly also
 * satisfies this for free.
 */
export default function useTooltipAuxData(hoveredIso2) {
  const {
    activeLayer,
    combineMode,
    worldBankLayerCache,
    setWorldBankLayerData,
    setLastError,
  } = useStore()

  const timerRef = useRef(null)

  useEffect(() => {
    if (!hoveredIso2 || combineMode) return

    const breakdownType = LAYERS[activeLayer]?.breakdown?.type
    const needed = NEEDED_INDICATORS[breakdownType]
    if (!needed) return

    const missing = needed.filter((indicator) => !worldBankLayerCache[indicator])
    if (missing.length === 0) return

    let cancelled = false
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const results = await Promise.all(missing.map((indicator) => fetchIndicatorAllCountries(indicator)))
        if (cancelled) return
        missing.forEach((indicator, i) => setWorldBankLayerData(indicator, results[i]))
      } catch (err) {
        if (cancelled) return
        console.error('Tooltip auxiliary data fetch failed:', err)
        setLastError(`Failed to load breakdown data: ${err.message}`)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
    }
  }, [hoveredIso2, activeLayer, combineMode, worldBankLayerCache, setWorldBankLayerData, setLastError])
}
