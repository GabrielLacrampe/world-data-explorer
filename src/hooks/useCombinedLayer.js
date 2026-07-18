import { useEffect, useRef } from 'react'
import useStore from '../store/useStore'
import { LAYERS, isCombinableLayer } from '../layers'
import { fetchIndicatorAllCountries } from '../utils/worldBank'
import { fetchImfIndicatorLatest } from '../utils/imf'
import { getDataset, wbKey, imfKey } from '../lib/datasets'
import { buildMatchExpression, normalizeValue, combineNormalizedScores } from '../utils/colorScale'

const DEBOUNCE_MS = 150

export default function useCombinedLayer() {
  const combineMode           = useStore((s) => s.combineMode)
  const combinedLayers        = useStore((s) => s.combinedLayers)
  const worldBankLayerCache   = useStore((s) => s.worldBankLayerCache)
  const setWorldBankLayerData = useStore((s) => s.setWorldBankLayerData)
  const imfLayerCache         = useStore((s) => s.imfLayerCache)
  const setImfLayerData       = useStore((s) => s.setImfLayerData)
  const allCountriesData      = useStore((s) => s.allCountriesData)
  const staticData            = useStore((s) => s.staticData)
  const setFillExpression     = useStore((s) => s.setFillExpression)
  const setLayerLoading       = useStore((s) => s.setLayerLoading)
  const setLastError          = useStore((s) => s.setLastError)

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
              const data = await getDataset(wbKey(layer.indicator), () =>
                fetchIndicatorAllCountries(layer.indicator, { mrv: layer.mrv })
              )
              if (!cancelled) setWorldBankLayerData(layer.indicator, data)
              return [key, data]
            }
            if (layer.source === 'imf') {
              let iso3Data = imfLayerCache[layer.indicator]
              if (!iso3Data) {
                iso3Data = await getDataset(imfKey(layer.dataflow, layer.indicator), () =>
                  fetchImfIndicatorLatest(layer.indicator, { dataflow: layer.dataflow })
                )
                if (!cancelled) setImfLayerData(layer.indicator, iso3Data)
              }
              const iso2Data = {}
              if (allCountriesData) {
                Object.entries(allCountriesData).forEach(([iso2, c]) => {
                  if (c.cca3 && iso3Data[c.cca3] !== undefined) iso2Data[iso2] = iso3Data[c.cca3]
                })
              }
              return [key, iso2Data]
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
  }, [combineMode, combinedLayers, staticData, allCountriesData])
}
