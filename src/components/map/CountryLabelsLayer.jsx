import { Source, Layer } from 'react-map-gl/maplibre'
import {
  LABEL_REF_ZOOM,
  LABEL_FADE_IN,
  LABEL_FADE_OUT,
} from '../../config/labelConfig'

// Sticker scaling: rendered size = labelSize · 2^(zoom − LABEL_REF_ZOOM), so
// the label grows at exactly the same rate as the country polygon. With an
// exponential base-2 interpolation, two stops reproduce that curve exactly.
const TEXT_SIZE = [
  'interpolate', ['exponential', 2], ['zoom'],
  0,  ['*', ['get', 'labelSize'], 2 ** (0 - LABEL_REF_ZOOM)],
  10, ['*', ['get', 'labelSize'], 2 ** (10 - LABEL_REF_ZOOM)],
]

// Per-feature visibility: each label fades in at its own appearZoom (rendered
// size reaches LABEL_MIN_PX) and out at its fadeZoom (LABEL_MAX_PX). MapLibre
// only allows ['zoom'] at the top level of an interpolate, so we sample the
// per-feature opacity formula at fixed zoom stops; 0.25 steps keep the
// piecewise-linear approximation visually smooth.
function opacityAt(zoom) {
  return ['max', 0, ['min', 1,
    ['/', ['-', zoom, ['get', 'appearZoom']], LABEL_FADE_IN],
    ['/', ['-', ['get', 'fadeZoom'], zoom], LABEL_FADE_OUT],
  ]]
}

const TEXT_OPACITY = [
  'interpolate', ['linear'], ['zoom'],
  ...Array.from({ length: 41 }, (_, i) => i * 0.25).flatMap((z) => [z, opacityAt(z)]),
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
