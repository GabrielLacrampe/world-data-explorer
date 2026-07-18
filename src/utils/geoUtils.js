import {
  LABEL_OVERRIDES,
  LABEL_REF_ZOOM,
  LABEL_MIN_PX,
  LABEL_MAX_PX,
  LABEL_CHAR_WIDTH,
  LABEL_FILL_FRAC,
  LABEL_HEIGHT_FRAC,
  LABEL_MIN_ASPECT,
  LABEL_TILT_SNAP,
} from '../config/labelConfig'

const GEO_ISO2 = 'ISO3166-1-Alpha-2'
const GEO_NAME = 'name'

// World width in px at the reference zoom. All label geometry is done in
// projected px space so font sizes come out directly in px at LABEL_REF_ZOOM.
const REF_WORLD_PX = 512 * 2 ** LABEL_REF_ZOOM
const FALLBACK_SIZE = 6 // px, used when the chord computation degenerates

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

// ─── Web Mercator (y grows southward, like screen coordinates) ───────────────

function project([lng, lat]) {
  const s = Math.sin((lat * Math.PI) / 180)
  return [
    ((lng + 180) / 360) * REF_WORLD_PX,
    (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * REF_WORLD_PX,
  ]
}

function unproject([x, y]) {
  const a = (0.5 - y / REF_WORLD_PX) * 4 * Math.PI
  return [
    (x / REF_WORLD_PX) * 360 - 180,
    (Math.asin(Math.tanh(a / 2)) * 180) / Math.PI,
  ]
}

// Shift longitudes so rings crossing the antimeridian stay continuous.
function unwrapRing(ring) {
  const out = [ring[0]]
  for (let i = 1; i < ring.length; i++) {
    let lng = ring[i][0]
    const prev = out[i - 1][0]
    if (lng - prev > 180) lng -= 360
    else if (lng - prev < -180) lng += 360
    out.push([lng, ring[i][1]])
  }
  return out
}

// Principal axis of the ring's vertices (PCA). Returns the axis angle in
// radians (screen convention: clockwise from horizontal) and the elongation
// ratio of the shape (1 = round, higher = more stretched).
function principalAxis(pts) {
  let mx = 0, my = 0
  for (const [x, y] of pts) { mx += x; my += y }
  mx /= pts.length; my /= pts.length

  let sxx = 0, sxy = 0, syy = 0
  for (const [x, y] of pts) {
    const dx = x - mx, dy = y - my
    sxx += dx * dx; sxy += dx * dy; syy += dy * dy
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy)
  const tr = sxx + syy
  const det = sxx * syy - sxy * sxy
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det))
  const l1 = tr / 2 + disc
  const l2 = tr / 2 - disc
  const aspect = l2 > 1e-9 ? Math.sqrt(l1 / l2) : Infinity
  return { centroid: [mx, my], angle, aspect }
}

// Longest run of the line {P + t·d} that lies inside the ring. Concave shapes
// yield several interior intervals; keeping the longest one guarantees both
// the anchor (its midpoint) and the text extent stay inside the polygon.
function longestInteriorChord(pts, P, d) {
  const n = [-d[1], d[0]]
  const ts = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const sa = (a[0] - P[0]) * n[0] + (a[1] - P[1]) * n[1]
    const sb = (b[0] - P[0]) * n[0] + (b[1] - P[1]) * n[1]
    if (sa > 0 !== sb > 0) {
      const u = sa / (sa - sb)
      const qx = a[0] + u * (b[0] - a[0])
      const qy = a[1] + u * (b[1] - a[1])
      ts.push((qx - P[0]) * d[0] + (qy - P[1]) * d[1])
    }
  }
  if (ts.length < 2) return null
  ts.sort((a, b) => a - b)
  let best = null
  for (let i = 0; i + 1 < ts.length; i += 2) {
    const len = ts[i + 1] - ts[i]
    if (!best || len > best.len) best = { len, mid: (ts[i] + ts[i + 1]) / 2 }
  }
  return best
}

/**
 * Compute anchor, font size and rotation so the label fits inside the ring.
 * `forcedRotate` (degrees, from an override) skips the PCA angle but still
 * measures the chord along it, so the size adapts to the forced orientation.
 */
function fitLabelToRing(ring, name, forcedRotate) {
  const pts = unwrapRing(ring).map(project)
  const { centroid, angle, aspect } = principalAxis(pts)

  let deg
  if (forcedRotate != null) {
    deg = forcedRotate
  } else {
    deg = (angle * 180) / Math.PI
    if (deg > 90) deg -= 180
    else if (deg < -90) deg += 180
    // Roundish countries and near-horizontal axes read better unrotated.
    if (aspect < LABEL_MIN_ASPECT || Math.abs(deg) < LABEL_TILT_SNAP) deg = 0
  }

  const rad = (deg * Math.PI) / 180
  const d = [Math.cos(rad), Math.sin(rad)]
  const chord = longestInteriorChord(pts, centroid, d)
  if (!chord) {
    return { anchor: unproject(centroid), size: FALLBACK_SIZE, rotate: 0 }
  }

  const anchorPx = [centroid[0] + chord.mid * d[0], centroid[1] + chord.mid * d[1]]
  const perp = longestInteriorChord(pts, anchorPx, [-d[1], d[0]])

  const chars = Math.max(name.length, 3)
  const sizeByWidth = (chord.len * LABEL_FILL_FRAC) / (chars * LABEL_CHAR_WIDTH)
  const sizeByHeight = perp ? perp.len * LABEL_HEIGHT_FRAC : sizeByWidth
  const size = Math.max(Math.min(sizeByWidth, sizeByHeight), 1)

  return { anchor: unproject(anchorPx), size, rotate: deg }
}

/**
 * Build the label point FeatureCollection. Each feature carries:
 *   labelSize   — px at LABEL_REF_ZOOM (auto-fit to the largest polygon,
 *                 unless overridden in LABEL_OVERRIDES)
 *   labelRotate — degrees clockwise
 *   appearZoom  — zoom at which the rendered size reaches LABEL_MIN_PX
 *   fadeZoom    — zoom at which the rendered size reaches LABEL_MAX_PX
 */
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
    const fit = fitLabelToRing(bestRing, name, override.rotate)
    const size = override.size ?? fit.size
    const [dLng, dLat] = override.offset ?? [0, 0]
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [fit.anchor[0] + dLng, fit.anchor[1] + dLat],
      },
      properties: {
        name,
        [GEO_ISO2]: iso2,
        labelSize: size,
        labelRotate: fit.rotate,
        appearZoom: LABEL_REF_ZOOM + Math.log2(LABEL_MIN_PX / size),
        fadeZoom: LABEL_REF_ZOOM + Math.log2(LABEL_MAX_PX / size),
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
