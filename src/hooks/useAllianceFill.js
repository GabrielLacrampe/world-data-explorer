import { useMemo } from 'react'
import useStore from '../store/useStore'
import { useRelationships } from './useRelationships'

const GEO_ISO2 = 'ISO3166-1-Alpha-2'

const REL_COLORS = {
  war:      '#ef4444',
  conflict: '#f97316',
  rivalry:  '#f59e0b',
  tension:  '#a78bfa',
  alliance: '#22c55e',
}

// Priority order when a country appears in several relationships
const PRIORITY = { war: 0, conflict: 1, rivalry: 2, tension: 3, alliance: 4 }

/**
 * When the Alliances layer is active and a country is selected, returns a
 * MapLibre fill expression coloring that country's relationship partners by
 * type (war > conflict > rivalry > tension > alliance). Null otherwise, so
 * callers can fall back to the regular layer fill.
 */
export default function useAllianceFill() {
  const activeLayer      = useStore((s) => s.activeLayer)
  const combineMode      = useStore((s) => s.combineMode)
  const selectedCountry  = useStore((s) => s.selectedCountry)
  const allCountriesData = useStore((s) => s.allCountriesData)

  const { data: relationships, iso3: selectedIso3 } = useRelationships(
    activeLayer === 'alliances' ? selectedCountry?.code : null
  )

  const iso3ToIso2 = useMemo(() => {
    if (!allCountriesData) return {}
    const out = {}
    for (const [iso2, c] of Object.entries(allCountriesData)) {
      if (c.cca3) out[c.cca3] = iso2
    }
    return out
  }, [allCountriesData])

  return useMemo(() => {
    if (activeLayer !== 'alliances' || combineMode) return null  // combine mode owns the fill
    if (!selectedCountry || !relationships?.length) return null

    const best = {} // iso2 → { color, priority }
    for (const rel of relationships) {
      const partners = [...(rel.side_a ?? []), ...(rel.side_b ?? [])].filter((c) => c !== selectedIso3)
      const color = REL_COLORS[rel.type] ?? '#6b7280'
      const priority = PRIORITY[rel.type] ?? 5
      for (const partnerIso3 of partners) {
        const iso2 = iso3ToIso2[partnerIso3]
        if (!iso2) continue
        if (!best[iso2] || priority < best[iso2].priority) best[iso2] = { color, priority }
      }
    }

    const entries = Object.entries(best)
    if (!entries.length) return null
    const args = []
    for (const [iso2, { color }] of entries) args.push(iso2, color)
    return ['match', ['get', GEO_ISO2], ...args, '#1a2535']
  }, [activeLayer, combineMode, selectedCountry, relationships, selectedIso3, iso3ToIso2])
}
