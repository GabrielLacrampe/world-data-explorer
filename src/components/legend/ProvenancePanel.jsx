import { useEffect, useState } from 'react'
import useStore from '../../store/useStore'
import { getDatasetMeta } from '../../lib/datasets'
import { getDatasetKeyForLayer, getMissingCountries } from '../../utils/provenance'
import { TOOLTIP_PANEL_CLASS } from '../Tooltip'

const MAX_LISTED = 12

function formatFetchedAt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Provenance/quality details for the active data layer: what it measures,
 * where it's from, when it was last refreshed, and which countries have no
 * data. Opened from the (i) button next to the legend's "Source:" line.
 */
export default function ProvenancePanel({ layerKey, layer }) {
  const datasetKey = getDatasetKeyForLayer(layer)

  const [meta, setMeta] = useState(null)
  const [metaLoading, setMetaLoading] = useState(true)

  // Reset during render, not in the effect below — react.dev's "adjusting
  // state when a prop changes" — the effect only sets state from its async
  // callback (mirrors useGovernmentData.js's lastIso2 pattern).
  const [lastDatasetKey, setLastDatasetKey] = useState(null)
  if (datasetKey !== lastDatasetKey) {
    setLastDatasetKey(datasetKey)
    setMeta(null)
    setMetaLoading(!!datasetKey)
  }

  const worldBankLayerCache = useStore((s) => s.worldBankLayerCache)
  const imfLayerCache       = useStore((s) => s.imfLayerCache)
  const staticData          = useStore((s) => s.staticData)
  const historicalData      = useStore((s) => s.historicalData)
  const activeYear          = useStore((s) => s.activeYear)
  const allCountriesData    = useStore((s) => s.allCountriesData)

  useEffect(() => {
    if (!datasetKey) return
    let cancelled = false
    getDatasetMeta(datasetKey).then((result) => {
      if (!cancelled) {
        setMeta(result)
        setMetaLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [datasetKey])

  const missing = getMissingCountries(layerKey, {
    worldBankLayerCache, imfLayerCache, staticData, historicalData, activeYear, allCountriesData,
  })
  const total = allCountriesData ? Object.keys(allCountriesData).length : 0
  const covered = total - missing.length
  const coveragePct = total > 0 ? Math.round((covered / total) * 100) : 0
  const attribution = layer.historical?.attribution ?? layer.attribution
  const listed = missing.slice(0, MAX_LISTED)

  return (
    <div className={`absolute bottom-full right-0 mb-1.5 w-64 max-h-80 overflow-y-auto ${TOOLTIP_PANEL_CLASS}`}>
      <div className="flex flex-col gap-2.5">
        {layer.description && (
          <div>
            <p className="text-[#4b5563] text-[9px] uppercase tracking-[0.12em] mb-0.5">About</p>
            <p className="text-[#94a3b8] text-xs leading-snug">{layer.description}</p>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[#4b5563] text-xs">Source</p>
          <p className="text-[#e2e8f0] text-xs text-right">{attribution ?? '—'}</p>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[#4b5563] text-xs">Last updated</p>
          <p className="text-[#e2e8f0] text-xs text-right">
            {metaLoading ? '…' : formatFetchedAt(meta?.fetched_at)}
          </p>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[#4b5563] text-xs">Coverage</p>
          <p className="text-[#e2e8f0] text-xs text-right">
            {total > 0 ? `${covered} of ${total} (${coveragePct}%)` : '—'}
          </p>
        </div>

        {missing.length > 0 && (
          <div className="pt-1.5 border-t border-[#1e2736]">
            <p className="text-[#4b5563] text-[9px] uppercase tracking-[0.12em] mb-1">
              No data ({missing.length})
            </p>
            <p className="text-[#6b7280] text-xs leading-snug">
              {listed.map((c) => c.name).join(', ')}
              {missing.length > MAX_LISTED && ` +${missing.length - MAX_LISTED} more`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
