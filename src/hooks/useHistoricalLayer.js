import { useEffect } from 'react'
import useStore from '../store/useStore'
import { LAYERS } from '../layers'
import { fetchOwidHistorical } from '../utils/owidApi'
import { buildLayerExpression } from '../utils/colorScale'

export default function useHistoricalLayer() {
  const activeLayer          = useStore((s) => s.activeLayer)
  const activeYear           = useStore((s) => s.activeYear)
  const combineMode          = useStore((s) => s.combineMode)
  const historicalData       = useStore((s) => s.historicalData)
  const setHistoricalData    = useStore((s) => s.setHistoricalData)
  const setActiveYear        = useStore((s) => s.setActiveYear)
  const setIsPlaying         = useStore((s) => s.setIsPlaying)
  const setHistoricalLoading = useStore((s) => s.setHistoricalLoading)
  const setFillExpression    = useStore((s) => s.setFillExpression)
  const setLastError         = useStore((s) => s.setLastError)

  // Layer change: reset year, stop playback, fetch data if not cached
  useEffect(() => {
    const layer = LAYERS[activeLayer]
    if (!layer.historical) {
      setActiveYear(null)
      setIsPlaying(false)
      return
    }

    const { owidChart, defaultYear } = layer.historical
    setIsPlaying(false)
    setActiveYear(defaultYear)

    if (historicalData[owidChart]) return

    setHistoricalLoading(true)
    fetchOwidHistorical(owidChart)
      .then(data => setHistoricalData(owidChart, data))
      .catch(err => {
        console.error('OWID historical fetch failed:', err)
        setLastError(`Failed to load historical data: ${err.message}`)
      })
      .finally(() => setHistoricalLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayer])

  // Year or data change: rebuild fill expression
  useEffect(() => {
    if (combineMode) return  // handled by useCombinedLayer
    if (activeYear === null) return

    const layer = LAYERS[activeLayer]
    if (!layer.historical) return

    const data = historicalData[layer.historical.owidChart]
    if (!data) return

    // Snap to the closest year within yearRange that has data
    const [minYear, maxYear] = layer.historical.yearRange
    const years = Object.keys(data).map(Number).filter(y => y >= minYear && y <= maxYear)
    if (years.length === 0) return
    const closest = years.reduce((prev, curr) =>
      Math.abs(curr - activeYear) < Math.abs(prev - activeYear) ? curr : prev
    )
    const yearData = data[closest]
    if (!yearData) return

    const expression = buildLayerExpression(yearData, layer)
    if (expression) setFillExpression(expression)
  }, [activeYear, activeLayer, historicalData, setFillExpression, combineMode])
}
