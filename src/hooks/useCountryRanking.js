import { useMemo } from 'react'
import useStore from '../store/useStore'
import { getCountryRanking } from '../utils/ranking'

/**
 * Exact world rank/percentile/regional-average for the selected country on
 * whichever layer is currently coloring the map. Pure derivation over data
 * already in the store — no fetch (mirrors useAllianceFill.js's idiom).
 */
export default function useCountryRanking() {
  const activeLayer         = useStore((s) => s.activeLayer)
  const selectedCountry     = useStore((s) => s.selectedCountry)
  const worldBankLayerCache = useStore((s) => s.worldBankLayerCache)
  const imfLayerCache       = useStore((s) => s.imfLayerCache)
  const staticData          = useStore((s) => s.staticData)
  const historicalData      = useStore((s) => s.historicalData)
  const activeYear          = useStore((s) => s.activeYear)
  const allCountriesData    = useStore((s) => s.allCountriesData)

  return useMemo(() => {
    if (!selectedCountry?.code) return null
    return getCountryRanking(activeLayer, selectedCountry.code, {
      worldBankLayerCache, imfLayerCache, staticData, historicalData, activeYear, allCountriesData,
    })
  }, [
    activeLayer, selectedCountry, worldBankLayerCache, imfLayerCache,
    staticData, historicalData, activeYear, allCountriesData,
  ])
}
