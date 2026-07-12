import { useEffect } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Legend from './components/Legend'
import LoadingOverlay from './components/LoadingOverlay'
import ErrorBanner from './components/ErrorBanner'
import useStore from './store/useStore'
import { buildLayerExpression, buildPoliticalExpression } from './utils/colorScale'
import { loadStaticDatasets } from './utils/staticData'
import { LAYERS } from './layers'
import useWorldBankLayer from './hooks/useWorldBankLayer'
import useImfLayer from './hooks/useImfLayer'
import useCountryData from './hooks/useCountryData'
import useHistoricalLayer from './hooks/useHistoricalLayer'
import useCombinedLayer from './hooks/useCombinedLayer'
import TimeSlider from './components/TimeSlider'

function App() {
  const activeLayer         = useStore((s) => s.activeLayer)
  const combineMode         = useStore((s) => s.combineMode)
  const setAllCountriesData = useStore((s) => s.setAllCountriesData)
  const setFillExpression   = useStore((s) => s.setFillExpression)
  const staticData          = useStore((s) => s.staticData)
  const setStaticData       = useStore((s) => s.setStaticData)
  const setLastError        = useStore((s) => s.setLastError)
  const worldData           = useStore((s) => s.worldData)

  useWorldBankLayer()
  useImfLayer()
  useCountryData()
  useHistoricalLayer()
  useCombinedLayer()

  useEffect(() => {
    loadStaticDatasets().then(({ datasets, failed }) => {
      setStaticData(datasets)
      if (failed.length > 0) {
        setLastError(`Some datasets failed to load: ${failed.join(', ')}. Affected layers may show no data.`)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-countries/countries.json')
      .then((res) => res.json())
      .then((data) => {
        const indexed = {}
        data.forEach((c) => {
          indexed[c.cca2] = {
            ...c,
            flags: { svg: `https://flagcdn.com/${c.cca2.toLowerCase()}.svg` },
          }
        })
        setAllCountriesData(indexed)
      })
      .catch((err) => console.error('Failed to load countries data:', err))
  }, [setAllCountriesData])

  useEffect(() => {
    if (combineMode) return  // handled by useCombinedLayer
    if ((activeLayer !== 'political' && activeLayer !== 'geographic' && activeLayer !== 'alliances') || !worldData) return
    const iso2Codes = worldData.features
      .map((f) => f.properties['ISO3166-1-Alpha-2'])
      .filter(Boolean)
    setFillExpression(buildPoliticalExpression(iso2Codes))
  }, [activeLayer, worldData, setFillExpression, combineMode])

  useEffect(() => {
    if (combineMode) return  // handled by useCombinedLayer
    const layer = LAYERS[activeLayer]
    if (layer.source !== 'static' || !staticData) return

    const dataset = staticData[layer.staticKey]
    if (!dataset) return

    const expression = buildLayerExpression(dataset, layer)
    if (expression) setFillExpression(expression)
  }, [activeLayer, staticData, setFillExpression, combineMode])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      <Map />
      <TopBar />
      <Sidebar />
      <Legend />
      <TimeSlider />
      <LoadingOverlay />
      <ErrorBanner />
      <SpeedInsights />
    </div>
  )
}

export default App
