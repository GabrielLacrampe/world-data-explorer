import { useEffect } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Legend from './components/Legend'
import LoadingOverlay from './components/LoadingOverlay'
import useStore from './store/useStore'
import { buildMatchExpression, valueToColor, buildPoliticalExpression } from './utils/colorScale'
import { fetchIndicatorAllCountries, fetchIndicatorsForCountry } from './utils/worldBank'
import { loadStaticDatasets } from './utils/staticData'
import { LAYERS, SIDEBAR_INDICATORS } from './layers'

function App() {
  const {
    selectedCountry,
    setSelectedCountry,
    countryData,
    setCountryData,
    setLoading,
    activeLayer,
    setActiveLayer,
    allCountriesData,
    setAllCountriesData,
    setFillExpression,
    worldBankLayerCache,
    setWorldBankLayerData,
    worldBankCountryData,
    setWorldBankCountryData,
    staticData,
    setStaticData,
    worldData,
    setCountryLoadError,
  } = useStore()

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
    if (!allCountriesData || !LAYERS[activeLayer].property) return

    const property = LAYERS[activeLayer].property
    const values = Object.values(allCountriesData)
      .map((c) => c[property])
      .filter((v) => v && v > 0)

    if (values.length === 0) {
      setFillExpression('#3b5998')
      return
    }

    const countryColors = {}
    Object.entries(allCountriesData).forEach(([code, country]) => {
      const value = country[property]
      countryColors[code] = valueToColor(value, values)
    })

    setFillExpression(buildMatchExpression(countryColors))
  }, [activeLayer, allCountriesData, setFillExpression])

  useEffect(() => {
    if ((activeLayer !== 'political' && activeLayer !== 'geographic' && activeLayer !== 'alliances') || !worldData) return
    const iso2Codes = worldData.features
      .map((f) => f.properties['ISO3166-1-Alpha-2'])
      .filter(Boolean)
    setFillExpression(buildPoliticalExpression(iso2Codes))
  }, [activeLayer, worldData, setFillExpression])

  useEffect(() => {
    if (!selectedCountry || !allCountriesData) return

    const code = selectedCountry.code
    if (code && code !== '-99' && allCountriesData[code]) {
      setCountryData(allCountriesData[code])
    } else {
      // Fallback: search by name
      const match = Object.values(allCountriesData).find(
        (c) => c.name?.common?.toLowerCase() === selectedCountry.name?.toLowerCase()
      )
      setCountryData(match ?? null)
      if (!match) setCountryLoadError(true)
    }
    setLoading('country', false)
  }, [selectedCountry, allCountriesData, setCountryData, setLoading, setCountryLoadError])

  useEffect(() => {
    const layer = LAYERS[activeLayer]
    if (layer.source !== 'worldbank') return

    const indicator = layer.indicator

    // Use cache if available
    if (worldBankLayerCache[indicator]) {
      buildAndSetWorldBankExpression(worldBankLayerCache[indicator])
      return
    }

    // Fetch and cache
    fetchIndicatorAllCountries(indicator)
      .then((data) => {
        setWorldBankLayerData(indicator, data)
        buildAndSetWorldBankExpression(data)
      })
      .catch((err) => {
        console.error('World Bank layer fetch failed:', err)
        setFillExpression('#3b5998')
      })
  }, [activeLayer])
  
  useEffect(() => {
    const layer = LAYERS[activeLayer]
    if (layer.source !== 'static' || !staticData) return

    const dataset = staticData[layer.staticKey]
    if (!dataset) return

    const values = Object.values(dataset).filter((v) => v !== null && v > 0)
    const countryColors = {}
    const scaleType = layer.scale ?? 'log'
    Object.entries(dataset).forEach(([code, value]) => {
      countryColors[code] = valueToColor(value, values, { scale: scaleType })
    })
    setFillExpression(buildMatchExpression(countryColors))
  }, [activeLayer, staticData, setFillExpression])

  useEffect(() => {
    if (!selectedCountry?.code || selectedCountry.code === '-99') return

    const indicators = SIDEBAR_INDICATORS.map((i) => i.indicator)

    fetchIndicatorsForCountry(selectedCountry.code, indicators)
      .then((data) => {
        setWorldBankCountryData(data)
      })
      .catch((err) => {
        console.error('World Bank country fetch failed:', err)
      })
  }, [selectedCountry])


  function buildAndSetWorldBankExpression(data) {
    const values = Object.values(data).filter((v) => v !== null && v > 0)
    if (values.length === 0) return

    const countryColors = {}
    Object.entries(data).forEach(([code, value]) => {
      countryColors[code] = valueToColor(value, values)
    })

    setFillExpression(buildMatchExpression(countryColors))
  }

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

