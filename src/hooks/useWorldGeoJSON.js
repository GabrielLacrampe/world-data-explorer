import { useEffect } from 'react'
import useStore from '../store/useStore'
import { patchGeoJSON } from '../utils/geoUtils'

// Self-hosted copy of datasets/geo-countries (countries.geojson) — served
// from our own origin so a third-party CDN outage can't break the map.
// Refresh it with: curl -L -o public/data/countries.geojson
//   https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson
const GEOJSON_URL = '/data/countries.geojson'

// Known ISO2 fixes for features the geo-countries dataset ships with code -99.
const NAME_TO_ISO2_FIXES = {
  'France':          'FR',
  'Norway':          'NO',
  'Northern Cyprus': 'CY',
  'Somaliland':      'SO',
  'Kosovo':          'XK',
}

/**
 * Loads the world GeoJSON into the store once, patching known bad ISO2
 * codes. Owns the map loading flag and surfaces failures in the ErrorBanner.
 */
export default function useWorldGeoJSON() {
  const setWorldData = useStore((s) => s.setWorldData)
  const setLoading   = useStore((s) => s.setLoading)
  const setLastError = useStore((s) => s.setLastError)

  useEffect(() => {
    fetch(GEOJSON_URL)
      .then((res) => {
        // fetch only rejects on network failure — HTTP errors resolve fine
        if (!res.ok) throw new Error(`HTTP ${res.status} loading world GeoJSON`)
        return res.json()
      })
      .then((data) => {
        setWorldData(patchGeoJSON(data, NAME_TO_ISO2_FIXES))
      })
      .catch((err) => {
        console.error('World GeoJSON load failed:', err)
        setLastError('Could not load the world map. Check your connection and reload the page.')
      })
      .finally(() => setLoading('map', false))
  }, [setWorldData, setLoading, setLastError])
}
