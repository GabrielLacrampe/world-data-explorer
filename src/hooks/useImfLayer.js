import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { LAYERS } from '../layers'
import { fetchImfIndicatorLatest } from '../utils/imf'
import { getDataset, imfKey } from '../lib/datasets'
import { buildLayerExpression } from '../utils/colorScale'

const DEBOUNCE_MS = 150

export default function useImfLayer() {
  const activeLayer       = useStore((s) => s.activeLayer)
  const combineMode       = useStore((s) => s.combineMode)
  const allCountriesData  = useStore((s) => s.allCountriesData)
  const imfLayerCache     = useStore((s) => s.imfLayerCache)
  const setImfLayerData   = useStore((s) => s.setImfLayerData)
  const setFillExpression = useStore((s) => s.setFillExpression)
  const setLastError      = useStore((s) => s.setLastError)
  const setLayerLoading   = useStore((s) => s.setLayerLoading)

  const timerRef = useRef(null)

  useEffect(() => {
    if (combineMode) return  // handled by useCombinedLayer
    const layer = LAYERS[activeLayer]
    if (layer.source !== 'imf') return
    if (!allCountriesData) return

    const indicator = layer.indicator
    let cancelled = false

    const buildExpression = (iso3Data) => {
      const iso2Data = {}
      Object.entries(allCountriesData).forEach(([iso2, c]) => {
        if (c.cca3 && iso3Data[c.cca3] !== undefined) iso2Data[iso2] = iso3Data[c.cca3]
      })

      const expression = buildLayerExpression(iso2Data, layer)
      if (expression) setFillExpression(expression)
    }

    if (imfLayerCache[indicator]) {
      buildExpression(imfLayerCache[indicator])
      return
    }

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLayerLoading(true)
      try {
        const data = await getDataset(imfKey(layer.dataflow, indicator), () =>
          fetchImfIndicatorLatest(indicator, { dataflow: layer.dataflow })
        )
        if (cancelled) return
        setImfLayerData(indicator, data)
        buildExpression(data)
      } catch (err) {
        if (cancelled) return
        console.error('IMF layer fetch failed:', err)
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
