import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { LAYERS, isCombinableLayer } from '../layers'
import { fetchIndicatorAllCountries } from '../utils/worldBank'
import { buildMatchExpression, normalizeValue, combineNormalizedScores } from '../utils/colorScale'

const DEBOUNCE_MS = 150

export default function useCombinedLayer() {
  const {
    combineMode,
    combinedLayers,
    worldBankLayerCache,
    setWorldBankLayerData,
    staticData,
    setFillExpression,
    setLayerLoading,
    setLastError,
  } = useStore()

  const timerRef = useRef(null)

  useEffect(() => {
    if (!combineMode) return

    const keys = combinedLayers.filter(isCombinableLayer)
    if (keys.length === 0) {
      setFillExpression('#3b5998')
      return
    }

    let cancelled = false

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLayerLoading(true)
      try {
        const entries = await Promise.all(
          keys.map(async (key) => {
            const layer = LAYERS[key]
            if (layer.source === 'worldbank') {
              if (worldBankLayerCache[layer.indicator]) return [key, worldBankLayerCache[layer.indicator]]
              const data = await fetchIndicatorAllCountries(layer.indicator, { mrv: layer.mrv })
              if (!cancelled) setWorldBankLayerData(layer.indicator, data)
              return [key, data]
            }
            return [key, (staticData && staticData[layer.staticKey]) || {}]
          })
        )
        if (cancelled) return
        const perLayerData = Object.fromEntries(entries)

        const layerValues = {}
        keys.forEach((key) => {
          const scale = LAYERS[key].scale ?? 'log'
          layerValues[key] = Object.values(perLayerData[key]).filter(
            (v) => v !== null && v !== undefined && (scale === 'log' ? v > 0 : true)
          )
        })

        const allIso2 = new Set()
        keys.forEach((key) => Object.keys(perLayerData[key]).forEach((iso2) => allIso2.add(iso2)))

        const countryColors = {}
        allIso2.forEach((iso2) => {
          const scores = keys.map((key) => {
            const layer = LAYERS[key]
            return normalizeValue(perLayerData[key][iso2], layerValues[key], {
              scale: layer.scale ?? 'log',
              invert: layer.invert ?? false,
            })
          })
          const color = combineNormalizedScores(scores)
          if (color !== null) countryColors[iso2] = color
        })

        setFillExpression(buildMatchExpression(countryColors))
      } catch (err) {
        if (cancelled) return
        console.error('Combined layer computation failed:', err)
        setLastError(`Failed to build combined layer: ${err.message}`)
      } finally {
        if (!cancelled) setLayerLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combineMode, combinedLayers, staticData])
}
