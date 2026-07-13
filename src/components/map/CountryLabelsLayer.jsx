import { Source, Layer } from 'react-map-gl/maplibre'
import {
  LABEL_REF_ZOOM,
  LABEL_LARGE_SHOW,
  LABEL_DEFAULT_SHOW,
  LABEL_FADE_IN,
  LABEL_FADE_START,
  LABEL_FADE_END,
} from '../../config/labelConfig'

// Large and default labels share everything except their filter and the
// zoom at which they fade in.
function labelLayerProps(id, isLarge, showZoom) {
  return {
    id,
    type: 'symbol',
    filter: ['==', ['get', 'isLarge'], isLarge],
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Bold'],
      'text-transform': 'uppercase',
      'text-size': [
        'interpolate', ['exponential', 2], ['zoom'],
        LABEL_REF_ZOOM - 2, ['*', ['get', 'labelSize'], 0.25],
        LABEL_REF_ZOOM,     ['get', 'labelSize'],
        LABEL_REF_ZOOM + 4, ['*', ['get', 'labelSize'], 16],
      ],
      'text-rotate': ['get', 'labelRotate'],
      'text-max-width': 6,
      'text-letter-spacing': 0.1,
    },
    paint: {
      'text-color': '#e8dcc8',
      'text-halo-color': 'rgba(0,0,0,0.75)',
      'text-halo-width': 1.5,
      'text-opacity': [
        'interpolate', ['linear'], ['zoom'],
        showZoom,                 0,
        showZoom + LABEL_FADE_IN, 1,
        LABEL_FADE_START,         1,
        LABEL_FADE_END,           0,
      ],
    },
  }
}

/** EU4-style country name labels, fading in by country size and zoom. */
export default function CountryLabelsLayer({ labelPoints }) {
  if (!labelPoints) return null

  return (
    <Source id="country-label-points" type="geojson" data={labelPoints}>
      <Layer {...labelLayerProps('country-labels-large', true, LABEL_LARGE_SHOW)} />
      <Layer {...labelLayerProps('country-labels-default', false, LABEL_DEFAULT_SHOW)} />
    </Source>
  )
}
