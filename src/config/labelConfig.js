// ─── Country label tuning ────────────────────────────────────────────────────
// Labels behave like stickers glued to the map: their on-screen size doubles
// with every zoom level, exactly like the country polygons do. Size and
// rotation are computed automatically from each country's polygon (see
// geoUtils.buildLabelPoints); the constants below tune that computation and
// the zoom-based visibility.

export const LABEL_REF_ZOOM = 3     // zoom at which `labelSize` px applies (scaling anchor)

// ── Visibility ───────────────────────────────────────────────────────────────
// A label fades in when its rendered size reaches LABEL_MIN_PX and starts
// fading out when it reaches LABEL_MAX_PX. Because size is tied to country
// size, small countries appear later and big ones bow out as you zoom in.
//
// LABEL_MAX_PX is pinned to MapLibre's hard text-size cap (MAX_GLYPH_ICON_SIZE
// = 255): the renderer clamps any larger size, freezing the sticker growth.
// Starting the fade exactly there hides the freeze. Raising this value only
// delays the fade — the label still stops growing at 255px.
export const LABEL_MIN_PX   = 9     // rendered px at which a label becomes legible → fade in
export const LABEL_MAX_PX   = 255   // rendered px at which the fade-out begins
export const LABEL_FADE_IN  = 0.5   // zoom span of the fade-in
export const LABEL_FADE_OUT = 1.0   // zoom span of the fade-out

// ── Auto-fit (size/rotation from polygon geometry) ───────────────────────────
export const LABEL_CHAR_WIDTH  = 0.7   // avg glyph width as fraction of font size (uppercase bold + letter-spacing)
export const LABEL_FILL_FRAC   = 0.85  // fraction of the interior chord the text may span
export const LABEL_HEIGHT_FRAC = 0.55  // font size cap as fraction of the perpendicular chord
export const LABEL_MIN_ASPECT  = 1.35  // min polygon elongation before a label gets rotated
export const LABEL_TILT_SNAP   = 12    // |angle| below this (degrees) snaps to horizontal

// ── Per-country overrides (ISO2 key) ─────────────────────────────────────────
// Every field is optional and beats the auto-computed value:
//   size   — px at zoom LABEL_REF_ZOOM.
//   rotate — degrees clockwise (-90..90). The auto-fit recomputes the interior
//            chord along this angle, so forcing e.g. -90 on a tall country also
//            lets the auto size grow to fill it vertically.
//   offset — [lngDelta, latDelta] in degrees from the computed anchor.
//            +lng = east, -lng = west, +lat = north, -lat = south.
// Example:
//   'PT': { rotate: -80, offset: [0, 0.5] },
export const LABEL_OVERRIDES = {
}

export const ALLIANCE_COLORS = {
  'Defense Pact':          '#ef4444',
  'Non-Aggression Treaty': '#f59e0b',
  'Neutrality Pact':       '#a78bfa',
  'Entente':               '#22c55e',
}
