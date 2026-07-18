import { Source, Layer } from 'react-map-gl/maplibre'
import {
  LABEL_REF_ZOOM,
  LABEL_MAX_PX,
  LABEL_FADE_IN,
  LABEL_FADE_OUT,
} from '../../config/labelConfig'

// Sticker scaling: rendered size = labelSize · 2^(zoom − LABEL_REF_ZOOM), so
// the label grows at exactly the same rate as the country polygon.
//
// Two implementation constraints from MapLibre's composite-size machinery
// (symbol_size.ts): per-feature sizes are baked per tile ONLY at the two
// expression stops covering [tileZoom, tileZoom+1], and any value above
// MAX_GLYPH_ICON_SIZE (255px) is clamped. Sparse stops therefore collapse the
// whole curve (with stops at 0 and 10, Russia rendered flat at ~38px at every
// zoom). So: one stop per integer zoom — the baked pair is always the true
// size at z and z+1 — and the 255px cap applied inside the expression, which
// also keeps glyph layout at the size actually drawn (no blurry SDF mush).
const TEXT_SIZE = [
  'interpolate', ['exponential', 2], ['zoom'],
  ...Array.from({ length: 11 }, (_, z) => [
    z,
    ['min', ['*', ['get', 'labelSize'], 2 ** (z - LABEL_REF_ZOOM)], LABEL_MAX_PX],
  ]).flat(),
]

// Per-feature visibility: each label fades in at its own appearZoom (rendered
// size reaches LABEL_MIN_PX) and is fully gone at its fadeZoom (fade starts
// LABEL_FADE_OUT earlier, when the size hits LABEL_MAX_PX). MapLibre only
// allows ['zoom'] at the top level of an interpolate, so we sample the
// per-feature opacity formula at fixed zoom stops; 0.25 steps keep the
// piecewise-linear approximation visually smooth. Stops reach zoom 12 so even
// the smallest labels (fadeZoom ≈ 12) finish their fade instead of freezing
// mid-transparency past the last stop.
function opacityAt(zoom) {
  return ['max', 0, ['min', 1,
    ['/', ['-', zoom, ['get', 'appearZoom']], LABEL_FADE_IN],
    ['/', ['-', ['get', 'fadeZoom'], zoom], LABEL_FADE_OUT],
  ]]
}

const TEXT_OPACITY = [
  'interpolate', ['linear'], ['zoom'],
  ...Array.from({ length: 49 }, (_, i) => i * 0.25).flatMap((z) => [z, opacityAt(z)]),
]

// Collision detection is disabled on purpose: every label fits inside its own
// polygon (see geoUtils.fitLabelToRing), so overlap is not expected and
// visibility must stay deterministic instead of depending on placement order.
const LABEL_LAYER = {
  id: 'country-labels',
  type: 'symbol',
  layout: {
    'text-field': ['get', 'name'],
    'text-font': ['Noto Sans Bold'],
    'text-transform': 'uppercase',
    'text-size': TEXT_SIZE,
    'text-rotate': ['get', 'labelRotate'],
    'text-max-width': 100, // single line — the fit is computed for one line
    'text-letter-spacing': 0.1,
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: {
    'text-color': '#e8dcc8',
    'text-halo-color': 'rgba(0,0,0,0.75)',
    'text-halo-width': 1.5,
    'text-opacity': TEXT_OPACITY,
  },
}

/** EU4-style country name labels, glued to the map and fading by country size. */
export default function CountryLabelsLayer({ labelPoints }) {
  if (!labelPoints) return null

  return (
    <Source id="country-label-points" type="geojson" data={labelPoints}>
      <Layer {...LABEL_LAYER} />
    </Source>
  )
}
