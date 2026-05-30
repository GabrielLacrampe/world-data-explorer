import { useEffect } from 'react'
import Map from './components/Map'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Legend from './components/Legend'
import LoadingOverlay from './components/LoadingOverlay'
import useStore from './store/useStore'
import { buildMatchExpression, valueToColor } from './utils/colorScale'
import { fetchIndicatorAllCountries } from './utils/worldBank'

const LAYERS = {
  // ── Existing layers ──────────────────────────────────────────────────
  none: { label: 'None', property: null, unit: '', source: 'static' },
  population: {
    label: 'Population',
    property: 'population',
    unit: 'people',
    source: 'restcountries',
  },
  area: {
    label: 'Area',
    property: 'area',
    unit: 'km²',
    source: 'restcountries',
  },

  // ── World Bank layers ────────────────────────────────────────────────
  gdp_per_capita: {
    label: 'GDP per Capita',
    indicator: 'NY.GDP.PCAP.CD',
    unit: 'USD',
    source: 'worldbank',
    format: 'currency',
  },
  gdp_growth: {
    label: 'GDP Growth',
    indicator: 'NY.GDP.MKTP.KD.ZG',
    unit: '%',
    source: 'worldbank',
    format: 'percent',
  },
  unemployment: {
    label: 'Unemployment',
    indicator: 'SL.UEM.TOTL.ZS',
    unit: '% of labor force',
    source: 'worldbank',
    format: 'percent',
  },
  life_expectancy: {
    label: 'Life Expectancy',
    indicator: 'SP.DYN.LE00.IN',
    unit: 'years',
    source: 'worldbank',
    format: 'decimal',
  },
  co2_per_capita: {
    label: 'CO₂ per Capita',
    indicator: 'EN.ATM.CO2E.PC',
    unit: 'tonnes',
    source: 'worldbank',
    format: 'decimal',
  },
  military_spending: {
    label: 'Military Spending',
    indicator: 'MS.MIL.XPND.GD.ZS',
    unit: '% of GDP',
    source: 'worldbank',
    format: 'percent',
  },
}

export { LAYERS }

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
  } = useStore()

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=cca2,population,area')
      .then((res) => res.json())
      .then((data) => {
        const indexd = {}
        data.forEach((c) => {
          indexd[c.cca2] = c
        })
        setAllCountriesData(indexd)
      })
  }, [setAllCountriesData])

  useEffect(() => {
    if (!allCountriesData || activeLayer === 'none') {
      setFillExpression('#3b5998')
      return
    }
    if (!allCountriesData || !LAYERS[activeLayer].property) {
      setFillExpression('#3b5998')
      return
    }

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
    if (!selectedCountry) return

    setLoading('country', true)
    setCountryData(null)

    const urlPath =
      selectedCountry.code && selectedCountry.code !== '-99'
        ? `https://restcountries.com/v3.1/alpha/${selectedCountry.code}`
        : `https://restcountries.com/v3.1/name/${selectedCountry.name}`

    fetch(urlPath)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setCountryData(data[0] ?? null)
        setLoading('country', false)
      })
      .catch((error) => {
        console.error('Error fetching country data:', error)
        setCountryData(null)
        setLoading('country', false)
      })
  }, [selectedCountry, setCountryData, setLoading])

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
      <TopBar layers={LAYERS} />
      <Sidebar />
      <Legend layers={LAYERS}/>
      <LoadingOverlay />
    </div>
  )
}



export default App

