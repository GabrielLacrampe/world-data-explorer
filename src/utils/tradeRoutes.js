// ─── Great circle interpolation ───────────────────────────────────────────────
const MAX_LAT = 65 // clamp polar excursions — 65° keeps arcs below Greenland/Iceland

// Normalize an array of [lng, lat] so no consecutive longitude jump exceeds 180°.
// Allows values outside [-180,180] — MapLibre renders these correctly as
// continuous lines crossing the anti-meridian without the "teleport" artifact.
function normalizeLngs(pts) {
  for (let i = 1; i < pts.length; i++) {
    const diff = pts[i][0] - pts[i - 1][0]
    if (diff > 180)  pts[i][0] -= 360
    if (diff < -180) pts[i][0] += 360
  }
  return pts
}

function gcArc(p1, p2, n = 20) {
  const toRad = d => d * Math.PI / 180
  const toDeg = r => r * 180 / Math.PI
  const [lng1, lat1] = p1
  const [lng2, lat2] = p2
  const φ1 = toRad(lat1), λ1 = toRad(lng1)
  const φ2 = toRad(lat2), λ2 = toRad(lng2)
  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
  ))
  if (d < 0.01) return [p1, p2]

  // Reduce steps on very long arcs to avoid wild polar swings
  const steps = d > Math.PI * 2 / 3 ? Math.min(n, 8) : n

  const pts = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2)
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2)
    const z = A * Math.sin(φ1) + B * Math.sin(φ2)
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))
    const lng = toDeg(Math.atan2(y, x))
    pts.push([lng, Math.max(-MAX_LAT, Math.min(MAX_LAT, lat))])
  }

  // Fix anti-meridian jumps within the arc itself
  return normalizeLngs(pts)
}

// Build a multi-segment great circle path through ordered waypoints.
// Longitudes are kept continuous across the anti-meridian (may exceed ±180).
function gcPath(waypoints, n = 20) {
  if (waypoints.length < 2) return waypoints
  const coords = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const seg = gcArc(waypoints[i], waypoints[i + 1], n)
    if (i === 0) {
      coords.push(...seg)
    } else {
      // Align first point of this segment with the last accumulated longitude
      const prevLng = coords[coords.length - 1][0]
      const segLng  = seg[0][0]
      const diff    = segLng - prevLng
      const offset  = diff > 180 ? -360 : diff < -180 ? 360 : 0
      coords.push(...seg.slice(1).map(([lng, lat]) => [lng + offset, lat]))
    }
  }
  // Final pass: ensure the entire path is continuous end-to-end
  return normalizeLngs(coords)
}

// ─── Chokepoints — hard strategic passages ────────────────────────────────────
// [lng, lat] — MapLibre uses lng first
const CP = {
  GIBRALTAR:  [ -5.35,  36.10],
  SUEZ:       [ 32.57,  30.07],
  BAB:        [ 43.43,  12.58],  // Bab-el-Mandeb
  HORMUZ:     [ 56.45,  26.50],
  MALACCA:    [103.50,   1.25],
  PANAMA:     [-79.92,   9.08],
  CAPE_GOOD:  [ 18.47, -34.22], // Cape of Good Hope
  DOVER:      [  1.35,  51.10],
  DANISH:     [ 12.00,  56.00], // Danish Straits (Baltic exit)
}

// ─── Mid-ocean anchor nodes — give routes natural corridors ───────────────────
const MN = {
  // Atlantic
  N_ATL:     [-30,   38],  // North Atlantic (Azores corridor)
  S_ATL:     [-18,  -32],  // South Atlantic (between Brazil and southern Africa)
  BISCAY:    [ -8,   45],  // Bay of Biscay (north of Iberia)
  CANARY:    [-18,   26],  // Canary Islands (West Africa turn)

  // Mediterranean
  W_MED:     [  7,   37],  // Western Mediterranean (Sardinia area)
  E_MED:     [ 28,   33],  // Eastern Mediterranean (Cyprus area)

  // Indian Ocean
  ARABIAN:   [ 62,   14],  // Arabian Sea (main W-India corridor)
  BAY_BENG:  [ 88,   12],  // Bay of Bengal
  SW_INDIAN: [ 72,  -26],  // SW Indian Ocean (Mozambique channel area)
  SE_INDIAN: [105,  -30],  // SE Indian Ocean (south of Australia)

  // Pacific
  N_PAC:     [170,   38],  // North Pacific shipping lane (Tokyo–LA corridor)
  S_PAC:     [-140, -20],  // South Pacific (AU/NZ → South America)
  C_PAC:     [180,    5],  // Central Pacific (date-line equatorial)

  // West Africa
  GUINEA:    [  3,    3],  // Gulf of Guinea (coast bend near Lagos)

  // Caribbean
  CARIB:     [-73,   14],  // Caribbean (between Panama and Atlantic)
}

const ISO2_ZONE = {
  // ── Atlantic West ──────────────────────────────────────────────────────────
  US:'ATL_W', CA:'ATL_W', MX:'ATL_W', GT:'ATL_W', BZ:'ATL_W', HN:'ATL_W',
  SV:'ATL_W', NI:'ATL_W', CR:'ATL_W', PA:'ATL_W', CU:'ATL_W', JM:'ATL_W',
  HT:'ATL_W', DO:'ATL_W', PR:'ATL_W', TT:'ATL_W', BB:'ATL_W', LC:'ATL_W',
  VC:'ATL_W', GD:'ATL_W', DM:'ATL_W', KN:'ATL_W', AG:'ATL_W', BS:'ATL_W',
  BR:'ATL_W', VE:'ATL_W', GY:'ATL_W', SR:'ATL_W', CO:'ATL_W', AR:'ATL_W',
  UY:'ATL_W', PY:'ATL_W', BO:'ATL_W',
  // ── Atlantic East + West Africa ────────────────────────────────────────────
  GB:'ATL_E', IE:'ATL_E', PT:'ATL_E', NO:'ATL_E', IS:'ATL_E', GL:'ATL_E',
  SN:'ATL_E', GN:'ATL_E', GW:'ATL_E', SL:'ATL_E', LR:'ATL_E', CI:'ATL_E',
  GH:'ATL_E', TG:'ATL_E', BJ:'ATL_E', NG:'ATL_E', CM:'ATL_E', GA:'ATL_E',
  CG:'ATL_E', CD:'ATL_E', AO:'ATL_E', NA:'ATL_E', CV:'ATL_E', ST:'ATL_E',
  GQ:'ATL_E', MR:'ATL_E', ML:'ATL_E', BF:'ATL_E', NE:'ATL_E', GM:'ATL_E',
  // ── Mediterranean + Black Sea ──────────────────────────────────────────────
  ES:'MED', FR:'MED', IT:'MED', MT:'MED', GR:'MED', HR:'MED', BA:'MED',
  ME:'MED', AL:'MED', MK:'MED', SI:'MED', MC:'MED', AD:'MED', SM:'MED',
  MA:'MED', DZ:'MED', TN:'MED', LY:'MED', TR:'MED', SY:'MED', LB:'MED',
  IL:'MED', PS:'MED', EG:'MED', CY:'MED', XK:'MED', RS:'MED', BG:'MED',
  RO:'MED', UA:'MED', GE:'MED', AM:'MED', AZ:'MED',
  // Central / Eastern Europe — landlocked but Med/Atlantic-oriented
  DE:'ATL_E', NL:'ATL_E', BE:'ATL_E', LU:'ATL_E', CH:'ATL_E', AT:'ATL_E',
  CZ:'ATL_E', SK:'ATL_E', HU:'ATL_E',
  // ── Baltic ────────────────────────────────────────────────────────────────
  SE:'BALTIC', FI:'BALTIC', EE:'BALTIC', LV:'BALTIC', LT:'BALTIC',
  PL:'BALTIC', DK:'BALTIC', RU:'BALTIC',
  // ── Red Sea corridor ──────────────────────────────────────────────────────
  DJ:'RED', ER:'RED', SD:'RED', YE:'RED',
  // ── Persian Gulf ──────────────────────────────────────────────────────────
  SA:'GULF', AE:'GULF', QA:'GULF', KW:'GULF', BH:'GULF', OM:'GULF',
  IR:'GULF', IQ:'GULF', JO:'GULF',
  // ── Indian Ocean ──────────────────────────────────────────────────────────
  IN:'INDIAN', PK:'INDIAN', LK:'INDIAN', BD:'INDIAN', MV:'INDIAN', NP:'INDIAN',
  BT:'INDIAN', AF:'INDIAN', SO:'INDIAN', KE:'INDIAN', TZ:'INDIAN', MZ:'INDIAN',
  MG:'INDIAN', SC:'INDIAN', MU:'INDIAN', ET:'INDIAN', ZA:'INDIAN',
  ZM:'INDIAN', ZW:'INDIAN', MW:'INDIAN', LS:'INDIAN', SZ:'INDIAN',
  UZ:'INDIAN', TM:'INDIAN', TJ:'INDIAN', KG:'INDIAN', KZ:'INDIAN', MN:'INDIAN',
  // ── Pacific West ──────────────────────────────────────────────────────────
  CN:'PAC_W', JP:'PAC_W', KR:'PAC_W', TW:'PAC_W', HK:'PAC_W', MO:'PAC_W',
  VN:'PAC_W', TH:'PAC_W', MY:'PAC_W', SG:'PAC_W', PH:'PAC_W', ID:'PAC_W',
  MM:'PAC_W', KH:'PAC_W', LA:'PAC_W', BN:'PAC_W', AU:'PAC_W', NZ:'PAC_W',
  PG:'PAC_W', FJ:'PAC_W', WS:'PAC_W', TO:'PAC_W', VU:'PAC_W', KI:'PAC_W',
  SB:'PAC_W', PW:'PAC_W', FM:'PAC_W', MH:'PAC_W', NR:'PAC_W',
  KP:'PAC_W',
  // ── Pacific East ──────────────────────────────────────────────────────────
  CL:'PAC_E', PE:'PAC_E', EC:'PAC_E',
}

function zone(iso2) {
  return ISO2_ZONE[iso2] ?? 'ATL_E'
}

// ─── Route waypoints between two zones ────────────────────────────────────────
function waypointsBetween(fromZone, toZone) {
  if (fromZone === toZone) return []

  const ROUTES = {
    // ── Atlantic ───────────────────────────────────────────────────────────────
    // Direct great-circle crossing — no hub node, arc handles the curve
    'ATL_E|ATL_W':   [],
    'ATL_E|MED':     [CP.GIBRALTAR, MN.W_MED],
    'ATL_E|RED':     [CP.GIBRALTAR, MN.W_MED, MN.E_MED, CP.SUEZ, CP.BAB],
    'ATL_E|GULF':    [CP.GIBRALTAR, MN.W_MED, MN.E_MED, CP.SUEZ, CP.BAB, CP.HORMUZ],
    'ATL_E|INDIAN':  [MN.CANARY, MN.GUINEA, CP.CAPE_GOOD, MN.SW_INDIAN],
    'ATL_E|PAC_W':   [MN.CANARY, MN.GUINEA, CP.CAPE_GOOD, MN.SW_INDIAN, MN.BAY_BENG, CP.MALACCA],
    'ATL_E|PAC_E':   [CP.GIBRALTAR, CP.PANAMA],
    'ATL_E|BALTIC':  [CP.DOVER, CP.DANISH],

    // ── Atlantic West ──────────────────────────────────────────────────────────
    'ATL_W|MED':     [CP.GIBRALTAR, MN.W_MED],
    'ATL_W|RED':     [CP.GIBRALTAR, MN.W_MED, MN.E_MED, CP.SUEZ, CP.BAB],
    'ATL_W|GULF':    [CP.GIBRALTAR, MN.W_MED, MN.E_MED, CP.SUEZ, CP.BAB, CP.HORMUZ],
    'ATL_W|INDIAN':  [CP.CAPE_GOOD, MN.SW_INDIAN],
    'ATL_W|PAC_W':   [CP.PANAMA],
    'ATL_W|PAC_E':   [CP.PANAMA],
    'ATL_W|BALTIC':  [CP.GIBRALTAR, CP.DOVER, CP.DANISH],

    // ── Mediterranean ─────────────────────────────────────────────────────────
    'MED|RED':       [MN.E_MED, CP.SUEZ, CP.BAB],
    'MED|GULF':      [MN.E_MED, CP.SUEZ, CP.BAB, CP.HORMUZ],
    'MED|INDIAN':    [MN.E_MED, CP.SUEZ, CP.BAB, MN.ARABIAN],
    'MED|PAC_W':     [MN.E_MED, CP.SUEZ, CP.BAB, MN.ARABIAN, CP.MALACCA],
    'MED|PAC_E':     [MN.W_MED, CP.GIBRALTAR, CP.PANAMA],
    'MED|BALTIC':    [MN.W_MED, CP.GIBRALTAR, CP.DOVER, CP.DANISH],
    'MED|ATL_E':     [MN.W_MED, CP.GIBRALTAR],
    'MED|ATL_W':     [MN.W_MED, CP.GIBRALTAR],

    // ── Gulf / Red Sea ────────────────────────────────────────────────────────
    'GULF|RED':      [CP.HORMUZ, CP.BAB],
    'GULF|INDIAN':   [CP.HORMUZ, MN.ARABIAN],
    'GULF|PAC_W':    [CP.HORMUZ, MN.ARABIAN, CP.MALACCA],
    'GULF|PAC_E':    [CP.HORMUZ, MN.ARABIAN, CP.MALACCA, CP.PANAMA],
    'GULF|BALTIC':   [CP.HORMUZ, CP.BAB, CP.SUEZ, MN.E_MED, MN.W_MED, CP.GIBRALTAR, CP.DOVER, CP.DANISH],
    'GULF|ATL_E':    [CP.HORMUZ, CP.BAB, CP.SUEZ, MN.E_MED, MN.W_MED, CP.GIBRALTAR],
    'GULF|ATL_W':    [CP.HORMUZ, CP.BAB, CP.SUEZ, MN.E_MED, MN.W_MED, CP.GIBRALTAR],
    'RED|INDIAN':    [CP.BAB, MN.ARABIAN],
    'RED|PAC_W':     [CP.BAB, CP.HORMUZ, MN.ARABIAN, CP.MALACCA],
    'RED|ATL_E':     [CP.BAB, CP.SUEZ, MN.E_MED, MN.W_MED, CP.GIBRALTAR],
    'RED|ATL_W':     [CP.BAB, CP.SUEZ, MN.E_MED, MN.W_MED, CP.GIBRALTAR],
    'RED|BALTIC':    [CP.BAB, CP.SUEZ, MN.E_MED, MN.W_MED, CP.GIBRALTAR, CP.DOVER, CP.DANISH],
    'RED|MED':       [CP.BAB, CP.SUEZ, MN.E_MED],
    'RED|PAC_E':     [CP.BAB, CP.SUEZ, MN.W_MED, CP.GIBRALTAR, CP.PANAMA],

    // ── Indian Ocean ──────────────────────────────────────────────────────────
    'INDIAN|PAC_W':  [MN.BAY_BENG, CP.MALACCA],
    'INDIAN|PAC_E':  [MN.BAY_BENG, CP.MALACCA, CP.PANAMA],
    'INDIAN|ATL_E':  [MN.SW_INDIAN, CP.CAPE_GOOD, MN.GUINEA, MN.CANARY],
    'INDIAN|ATL_W':  [MN.SW_INDIAN, CP.CAPE_GOOD],
    'INDIAN|BALTIC': [MN.SW_INDIAN, CP.CAPE_GOOD, CP.GIBRALTAR, CP.DOVER, CP.DANISH],
    'INDIAN|MED':    [MN.ARABIAN, CP.BAB, CP.SUEZ, MN.E_MED],
    'INDIAN|RED':    [MN.ARABIAN, CP.BAB],
    'INDIAN|GULF':   [MN.ARABIAN, CP.HORMUZ],

    // ── Pacific ───────────────────────────────────────────────────────────────
    // N_PAC waypoint anchors the arc to the North Pacific shipping lane (~38°N).
    // Without it the great circle between Asia and South America peaks above 65°N
    // and hits the MAX_LAT clamp, producing a flat horizontal artifact at the map top.
    'PAC_W|PAC_E':   [MN.N_PAC],
    'PAC_W|ATL_E':   [CP.MALACCA, MN.SW_INDIAN, CP.CAPE_GOOD, MN.GUINEA, MN.CANARY],
    'PAC_W|ATL_W':   [CP.MALACCA, MN.ARABIAN, CP.HORMUZ, CP.BAB, CP.SUEZ, MN.W_MED, CP.GIBRALTAR],
    'PAC_W|BALTIC':  [CP.MALACCA, MN.ARABIAN, CP.BAB, CP.SUEZ, MN.E_MED, MN.W_MED, CP.GIBRALTAR, CP.DOVER, CP.DANISH],
    'PAC_E|BALTIC':  [CP.PANAMA, CP.GIBRALTAR, CP.DOVER, CP.DANISH],
    'PAC_E|MED':     [CP.PANAMA, CP.GIBRALTAR, MN.W_MED],
    'PAC_E|RED':     [CP.PANAMA, CP.GIBRALTAR, MN.W_MED, MN.E_MED, CP.SUEZ, CP.BAB],
    'PAC_E|GULF':    [CP.PANAMA, CP.GIBRALTAR, MN.E_MED, CP.SUEZ, CP.BAB, CP.HORMUZ],
    'PAC_E|INDIAN':  [CP.PANAMA, MN.SE_INDIAN, MN.SW_INDIAN],

    // ── Baltic ────────────────────────────────────────────────────────────────
    'BALTIC|MED':    [CP.DANISH, CP.DOVER, CP.GIBRALTAR, MN.W_MED],
    'BALTIC|RED':    [CP.DANISH, CP.DOVER, CP.GIBRALTAR, MN.W_MED, MN.E_MED, CP.SUEZ, CP.BAB],
    'BALTIC|GULF':   [CP.DANISH, CP.DOVER, CP.GIBRALTAR, MN.E_MED, CP.SUEZ, CP.BAB, CP.HORMUZ],
    'BALTIC|INDIAN': [CP.DANISH, CP.DOVER, CP.GIBRALTAR, MN.CANARY, MN.GUINEA, CP.CAPE_GOOD, MN.SW_INDIAN],
    'BALTIC|PAC_W':  [CP.DANISH, CP.DOVER, CP.GIBRALTAR, MN.E_MED, CP.SUEZ, CP.BAB, MN.ARABIAN, CP.MALACCA],
    'BALTIC|PAC_E':  [CP.DANISH, CP.DOVER, CP.GIBRALTAR, CP.PANAMA],
  }

  // Directional lookup — no sorting. Try FROM|TO first, then reverse TO|FROM waypoints.
  // Reversing gives the correct physical path: PAC_W→ATL_W uses [Malacca…Gibraltar],
  // so ATL_W→PAC_W auto-reverses to [Gibraltar…Malacca], keeping all longitude steps
  // small and avoiding the polar arc caused by taking the "short" westward path.
  const fwd = ROUTES[`${fromZone}|${toZone}`]
  if (fwd !== undefined) return fwd
  const rev = ROUTES[`${toZone}|${fromZone}`]
  if (rev !== undefined) return [...rev].reverse()
  return []
}

// ─── Build GeoJSON from factbook export/import data ───────────────────────────
// nameToIso2: { 'germany': 'DE', ... }  — built from allCountriesData
function buildNameLookup(allCountriesData) {
  const lookup = {}
  for (const [iso2, c] of Object.entries(allCountriesData)) {
    lookup[c.name.common.toLowerCase()] = iso2
    lookup[c.name.official.toLowerCase()] = iso2
    // Common variations
    if (c.altSpellings) {
      for (const alt of c.altSpellings) lookup[alt.toLowerCase()] = iso2
    }
  }
  // Manual overrides for Factbook naming
  const MANUAL = {
    'united states': 'US', 'russia': 'RU', 'south korea': 'KR', 'north korea': 'KP',
    'iran': 'IR', 'syria': 'SY', 'vietnam': 'VN', 'laos': 'LA', 'taiwan': 'TW',
    'china': 'CN', 'japan': 'JP', 'germany': 'DE', 'france': 'FR', 'italy': 'IT',
    'spain': 'ES', 'netherlands': 'NL', 'united kingdom': 'GB', 'uk': 'GB',
    'brazil': 'BR', 'india': 'IN', 'canada': 'CA', 'mexico': 'MX',
    'saudi arabia': 'SA', 'uae': 'AE', 'united arab emirates': 'AE',
    'turkey': 'TR', 'poland': 'PL', 'belgium': 'BE', 'switzerland': 'CH',
    'australia': 'AU', 'indonesia': 'ID', 'thailand': 'TH', 'malaysia': 'MY',
    'singapore': 'SG', 'hong kong': 'HK', 'south africa': 'ZA',
    'czech republic': 'CZ', 'czechia': 'CZ', 'slovakia': 'SK', 'austria': 'AT',
    'hungary': 'HU', 'romania': 'RO', 'ukraine': 'UA', 'sweden': 'SE',
    'norway': 'NO', 'denmark': 'DK', 'finland': 'FI', 'greece': 'GR',
    'portugal': 'PT', 'israel': 'IL', 'egypt': 'EG', 'nigeria': 'NG',
    'ethiopia': 'ET', 'kenya': 'KE', 'tanzania': 'TZ', 'morocco': 'MA',
    'algeria': 'DZ', 'argentina': 'AR', 'chile': 'CL', 'colombia': 'CO',
    'peru': 'PE', 'venezuela': 'VE', 'pakistan': 'PK', 'bangladesh': 'BD',
    'myanmar': 'MM', 'philippines': 'PH',
    'new zealand': 'NZ', 'ireland': 'IE', 'iraq': 'IQ', 'kuwait': 'KW',
    'qatar': 'QA', 'oman': 'OM', 'bahrain': 'BH', 'jordan': 'JO',
    'ghana': 'GH', 'cameroon': 'CM', 'angola': 'AO',
    'mozambique': 'MZ', 'zambia': 'ZM', 'zimbabwe': 'ZW', 'uganda': 'UG',
    'senegal': 'SN', 'ivory coast': "CI", "cote d'ivoire": 'CI',
    'democratic republic of the congo': 'CD', 'republic of congo': 'CG',
    'north macedonia': 'MK',
  }
  return { ...lookup, ...MANUAL }
}

export function buildTradeGeoJSON(factbook, allCountriesData) {
  if (!factbook || !allCountriesData) return null

  const nameLookup = buildNameLookup(allCountriesData)

  // Build centroid lookup: ISO-2 → [lng, lat]
  const centroids = {}
  for (const [iso2, c] of Object.entries(allCountriesData)) {
    if (c.latlng?.length === 2) {
      centroids[iso2] = [c.latlng[1], c.latlng[0]] // world-countries has [lat, lng], MapLibre wants [lng, lat]
    }
  }

  const features = []

  for (const [fromIso2, data] of Object.entries(factbook)) {
    const fromCoord = centroids[fromIso2]
    if (!fromCoord) continue

    const fromZone = zone(fromIso2)

    const processPartners = (partners, type) => {
      if (!partners?.length) return
      for (const { name, pct } of partners) {
        const toIso2 = nameLookup[name.toLowerCase()]
        if (!toIso2 || toIso2 === fromIso2) continue
        const toCoord = centroids[toIso2]
        if (!toCoord) continue

        const toZone = zone(toIso2)
        const waypoints = waypointsBetween(fromZone, toZone)

        const coords = gcPath([fromCoord, ...waypoints, toCoord])

        features.push({
          type: 'Feature',
          properties: { from: fromIso2, to: toIso2, pct, type },
          geometry: { type: 'LineString', coordinates: coords },
        })
      }
    }

    processPartners(data.exportPartners, 'export')
    processPartners(data.importPartners, 'import')
  }

  return { type: 'FeatureCollection', features }
}
