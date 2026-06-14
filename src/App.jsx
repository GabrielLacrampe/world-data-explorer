import { useEffect } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Legend from './components/Legend'
import LoadingOverlay from './components/LoadingOverlay'
import useStore from './store/useStore'
import { buildMatchExpression, valueToColor, buildPoliticalExpression } from './utils/colorScale'
import { loadStaticDatasets } from './utils/staticData'
import { LAYERS } from './layers'
import useWorldBankLayer from './hooks/useWorldBankLayer'
import useCountryData from './hooks/useCountryData'

function App() {
  const {
    activeLayer,
    allCountriesData,
    setAllCountriesData,
    setFillExpression,
    staticData,
    setStaticData,
    worldData,
  } = useStore()

  useWorldBankLayer()
  useCountryData()

  useEffect(() => {
    loadStaticDatasets()
      .then(setStaticData)
      .catch((err) => console.error('Static data load failed:', err))
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
    if ((activeLayer !== 'political' && activeLayer !== 'geographic' && activeLayer !== 'alliances') || !worldData) return
    const iso2Codes = worldData.features
      .map((f) => f.properties['ISO3166-1-Alpha-2'])
      .filter(Boolean)
    setFillExpression(buildPoliticalExpression(iso2Codes))
  }, [activeLayer, worldData, setFillExpression])

  useEffect(() => {
    const layer = LAYERS[activeLayer]
    if (layer.source !== 'static' || !staticData) return

    const dataset = staticData[layer.staticKey]
    if (!dataset) return

    const scaleType = layer.scale ?? 'log'
    const values = Object.values(dataset).filter((v) => v !== null && (scaleType === 'log' ? v > 0 : true))
    const countryColors = {}
    Object.entries(dataset).forEach(([code, value]) => {
      countryColors[code] = valueToColor(value, values, { scale: scaleType })
    })
    setFillExpression(buildMatchExpression(countryColors))
  }, [activeLayer, staticData, setFillExpression])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      <Map />
      <TopBar />
      <Sidebar />
      <Legend />
      <LoadingOverlay />
    </div>
  )
}

export default App
