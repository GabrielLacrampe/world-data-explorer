import { wbKey, imfKey, staticKey, owidKey } from '../config/datasets'
import { getLayerValueForCountry } from './tooltipContent'

/**
 * Resolves the Supabase dataset key actually backing a layer right now.
 * Historical layers are always driven by their OWID series once selected
 * (see tooltipContent.js's getLayerValueForCountry), so that takes priority
 * over the layer's base worldbank/imf/static indicator.
 *
 * @param {import('../layers').LayerDef} layer
 * @returns {string|null}
 */
export function getDatasetKeyForLayer(layer) {
  if (!layer) return null
  if (layer.historical) return owidKey(layer.historical.owidChart)
  if (layer.source === 'worldbank' && layer.indicator) return wbKey(layer.indicator)
  if (layer.source === 'imf' && layer.indicator) return imfKey(layer.dataflow, layer.indicator)
  if (layer.source === 'static' && layer.staticKey) return staticKey(layer.staticKey)
  return null
}

/**
 * Countries with no value for a layer right now. Diffs allCountriesData
 * against the same per-country lookup the map/tooltip already use, so the
 * list always agrees with what's actually paintable on the map.
 *
 * @param {string} layerKey
 * @param {object} storeSlices  Same shape getLayerValueForCountry expects.
 * @returns {Array<{code: string, name: string}>}
 */
export function getMissingCountries(layerKey, storeSlices) {
  const { allCountriesData } = storeSlices
  if (!allCountriesData) return []

  const missing = []
  for (const [code, country] of Object.entries(allCountriesData)) {
    const { value } = getLayerValueForCountry(layerKey, code, storeSlices)
    if (value === null) missing.push({ code, name: country.name?.common ?? code })
  }
  return missing
}
