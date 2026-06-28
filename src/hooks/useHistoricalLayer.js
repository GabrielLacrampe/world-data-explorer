import { useEffect } from 'react'
import useStore from '../store/useStore'
import { LAYERS } from '../layers'
import { fetchOwidHistorical } from '../utils/owidApi'
import { buildMatchExpression, valueToColor } from '../utils/colorScale'

export default function useHistoricalLayer() {
  const {
    activeLayer,
    activeYear,
    historicalData,
    setHistoricalData,
    setActiveYear,
    setIsPlaying,
    setHistoricalLoading,
    setFillExpression,
    setLastError,
  } = useStore()

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
    if (activeYear === null) return

    const layer = LAYERS[activeLayer]
    if (!layer.historical) return

    const data = historicalData[layer.historical.owidChart]
    if (!data) return

    // Snap to the closest available year with data
    const years = Object.keys(data).map(Number)
    if (years.length === 0) return
    const closest = years.reduce((prev, curr) =>
      Math.abs(curr - activeYear) < Math.abs(prev - activeYear) ? curr : prev
    )
    const yearData = data[closest]
    if (!yearData) return

    const scale  = layer.scale  ?? 'log'
    const invert = layer.invert ?? false
    const values = Object.values(yearData).filter(v =>
      v !== null && (scale === 'log' ? v > 0 : true)
    )
    if (values.length === 0) return

    const countryColors = {}
    Object.entries(yearData).forEach(([iso2, value]) => {
      countryColors[iso2] = valueToColor(value, values, { scale, invert })
    })
    setFillExpression(buildMatchExpression(countryColors))
  }, [activeYear, activeLayer, historicalData, setFillExpression])
}
