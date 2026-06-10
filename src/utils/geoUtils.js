import { LABEL_OVERRIDES, LABEL_BASE_SIZE } from '../config/labelConfig'

const GEO_ISO2 = 'ISO3166-1-Alpha-2'
const GEO_NAME = 'name'

export function polygonArea(ring) {
  let area = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  }
  return Math.abs(area / 2)
}

export function ringCentroid(ring) {
  let x = 0, y = 0
  for (const [lng, lat] of ring) { x += lng; y += lat }
  return [x / ring.length, y / ring.length]
}

export function buildLabelPoints(geojson) {
  const byIso2 = {}
  for (const f of geojson.features) {
    const iso2 = f.properties[GEO_ISO2]
    if (iso2 === '-99') continue
    if (!byIso2[iso2]) byIso2[iso2] = { name: f.properties[GEO_NAME], rings: [] }
    const polys = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates
    for (const poly of polys) byIso2[iso2].rings.push(poly[0])
  }

  const features = Object.entries(byIso2).map(([iso2, { name, rings }]) => {
    const bestRing = rings.reduce((best, ring) =>
      polygonArea(ring) > polygonArea(best) ? ring : best
    )
    const override = LABEL_OVERRIDES[iso2] ?? {}
    const [lng, lat] = ringCentroid(bestRing)
    const [dLng, dLat] = override.offset ?? [0, 0]
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng + dLng, lat + dLat] },
      properties: {
        name,
        [GEO_ISO2]: iso2,
        labelSize:   override.size   ?? LABEL_BASE_SIZE,
        labelRotate: override.rotate ?? 0,
        isLarge:     override.size   != null,
      },
    }
  })
  return { type: 'FeatureCollection', features }
}

export function patchGeoJSON(data, nameToIso2Fixes) {
  return {
    ...data,
    features: data.features.map((f) => {
      if (f.properties[GEO_ISO2] !== '-99') return f
      const fix = nameToIso2Fixes[f.properties[GEO_NAME]]
      if (!fix) return f
      return { ...f, properties: { ...f.properties, [GEO_ISO2]: fix } }
    }),
  }
}
