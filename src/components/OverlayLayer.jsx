import { Source, Layer } from 'react-map-gl/maplibre'
import useStore from '../store/useStore'

// Heatmap visible at low zoom, points visible at high zoom.
// The transition happens automatically based on zoom level.
const HEATMAP_MAX_ZOOM = 4    // heatmap fades out above zoom 4
const POINTS_MIN_ZOOM = 3     // points fade in from zoom 3

function OverlayLayer() {
  const overlays = useStore((state) => state.overlays)
  const conflictOverlay = overlays.conflicts

  if (!conflictOverlay.active || !conflictOverlay.data) return null

  return (
    <Source
      id="conflicts"
      type="geojson"
      data={conflictOverlay.data}
    >
      {/* ── Heatmap layer ─────────────────────────────────────────── */}
      <Layer
        id="conflicts-heatmap"
        type="heatmap"
        maxzoom={HEATMAP_MAX_ZOOM + 1}
        paint={{
          // Weight by fatalities — deadlier events heat more
          'heatmap-weight': [
            'interpolate', ['linear'],
            ['get', 'fatalities'],
            0, 0.3,    // events with 0 fatalities still show
            50, 1,     // 50+ fatalities = full weight
          ],
          // Intensity increases with zoom
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            0, 0.4,
            HEATMAP_MAX_ZOOM, 1.5,
          ],
          // Color: transparent → yellow → orange → red
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,    'rgba(0, 0, 0, 0)',
            0.2,  'rgba(234, 179, 8, 0.4)',
            0.4,  'rgba(249, 115, 22, 0.6)',
            0.6,  'rgba(239, 68, 68, 0.7)',
            0.8,  'rgba(185, 28, 28, 0.8)',
            1,    'rgba(127, 29, 29, 0.9)',
          ],
          // Radius increases with zoom
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            0, 8,
            HEATMAP_MAX_ZOOM, 25,
          ],
          // Heatmap fades out as points fade in
          'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            HEATMAP_MAX_ZOOM - 1, 1,
            HEATMAP_MAX_ZOOM, 0,
          ],
        }}
      />

      {/* ── Points layer ──────────────────────────────────────────── */}
      <Layer
        id="conflicts-points"
        type="circle"
        minzoom={POINTS_MIN_ZOOM}
        paint={{
          'circle-color': ['get', 'color'],
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            POINTS_MIN_ZOOM, 3,
            8, 7,
          ],
          'circle-opacity': [
            'interpolate', ['linear'], ['zoom'],
            POINTS_MIN_ZOOM, 0,
            POINTS_MIN_ZOOM + 1, 0.85,
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 0.5,
          'circle-stroke-opacity': 0.4,
        }}
      />
    </Source>
  )
}

export default OverlayLayer