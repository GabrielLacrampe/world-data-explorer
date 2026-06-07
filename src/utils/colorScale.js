const NO_DATA_COLOR = '#1e293b'

// Ten-stop gradient for data layers, from very low to very high.
const COLOR_SCALE = [
  '#0f172a',
  '#164e63',
  '#0369a1',
  '#0284c7',
  '#059669',
  '#65a30d',
  '#ca8a04',
  '#ea580c',
  '#dc2626',
  '#9f1239',
]

/**
 * Transforms a value into a gradient color.
 * Uses percentile clipping to reduce outlier distortion and logarithmic scaling
 * by default, which works well for country-level population and area values.
 */
export function valueToColor(
  value,
  allValues,
  {
    gradient = COLOR_SCALE,
    scale = 'log',
    lowerPercentile = 0.02,
    upperPercentile = 0.98,
  } = {}
) {
  if (!value || value <= 0) return NO_DATA_COLOR

  const values = Array.isArray(allValues)
    ? allValues.filter((v) => v && v > 0)
    : []

  if (values.length === 0) return NO_DATA_COLOR

  const transformedValues = values.map((v) => transformValue(v, scale))
  const transformedValue = transformValue(value, scale)
  const min = percentile(transformedValues, lowerPercentile)
  const max = percentile(transformedValues, upperPercentile)

  if (min === max) return gradient[Math.floor(gradient.length / 2)]

  const normalized = clamp((transformedValue - min) / (max - min), 0, 1)
  return interpolateGradient(gradient, normalized)
}

function transformValue(value, scale) {
  if (scale === 'log') return Math.log(Math.max(value, 1))
  return value
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b)
  const index = clamp(percentileValue, 0, 1) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) return sorted[lower]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

function interpolateGradient(gradient, normalizedValue) {
  const scaled = clamp(normalizedValue, 0, 1) * (gradient.length - 1)
  const lower = Math.floor(scaled)
  const upper = Math.ceil(scaled)
  const weight = scaled - lower

  if (lower === upper) return gradient[lower]
  return mixColors(gradient[lower], gradient[upper], weight)
}

function mixColors(fromHex, toHex, weight) {
  const from = hexToRgb(fromHex)
  const to = hexToRgb(toHex)
  const mixed = from.map((channel, index) =>
    Math.round(channel * (1 - weight) + to[index] * weight)
  )

  return rgbToHex(mixed)
}

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function rgbToHex(rgb) {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Calculates quantiles from all values for even color distribution.
 */
export function calculateQuantiles(allValues, numBuckets = COLOR_SCALE.length) {
  const sorted = [...allValues].sort((a, b) => a - b)
  const quantiles = []
  
  for (let i = 1; i < numBuckets; i++) {
    const index = Math.floor((i / numBuckets) * sorted.length)
    quantiles.push(sorted[index])
  }
  
  return quantiles
}

/**
 * Generates the ranges for the map legend.
 */
export function getLegendRanges(min, max, steps = 5) {
  const logMin = Math.log(Math.max(min, 1))
  const logMax = Math.log(Math.max(max, 1))
  const step = (logMax - logMin) / steps

  return Array.from({ length: steps }, (_, i) => {
    const logValue = logMin + step * i
    return Math.round(Math.exp(logValue))
  })
}

/**
 * Formats large numbers into human-readable strings with suffixes (K, M, B).
 * 1400000000 → "1.4B" | 17000000 → "17M" | 800000 → "800K"
 */
export function formatNumber(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

// EU4 country colors: ISO2 → hex. Sourced from game files + paimoe/eu4json.
// Countries not in this map render as EU4_MISSING_COLOR.
const EU4_MISSING_COLOR = '#f0f0f0'

const EU4_COLORS = {
  // ── Europe: West ─────────────────────────────────────────────────────
  'FR': '#4068b4', // France
  'ES': '#c1ab08', // Castile/Spain ✓
  'PT': '#3d8c3d', // Portugal
  'GB': '#c03030', // England
  'IE': '#3d8040', // Ireland
  'NL': '#d06010', // Holland
  'BE': '#c09020', // Belgium (Burgundy)
  'LU': '#c09020', // Luxembourg
  // ── Europe: Scandinavia ───────────────────────────────────────────────
  'SE': '#4878bc', // Sweden
  'DK': '#a01818', // Denmark
  'NO': '#75a5bc', // Norway ✓
  'FI': '#b68664', // Finland ✓
  'IS': '#4a7090', // Iceland
  // ── Europe: Germanic ─────────────────────────────────────────────────
  'DE': '#606080', // Brandenburg/Prussia/HRE
  'AT': '#be1515', // Austria
  'CH': '#997a6c', // Switzerland ✓
  // ── Europe: Eastern ──────────────────────────────────────────────────
  'PL': '#c03030', // Poland
  'CZ': '#c04545', // Bohemia
  'SK': '#c04545', // Slovakia
  'HU': '#3a7a3a', // Hungary
  'RO': '#a08040', // Wallachia/Romania
  'BG': '#4a5a9a', // Bulgaria
  'RS': '#4a5a9a', // Serbia
  'HR': '#685ef7', // Croatia ✓
  'SI': '#3a7a3a', // Slovenia
  'BA': '#4a5a9a', // Bosnia
  'ME': '#4a5a9a', // Montenegro
  'AL': '#6a5028', // Albania
  'MK': '#4a5a9a', // North Macedonia
  'GR': '#4a3070', // Greece
  'CY': '#4a3070', // Cyprus
  'MT': '#c03030', // Malta
  // ── Europe: Baltic ───────────────────────────────────────────────────
  'LT': '#3a8c32', // Lithuania
  'LV': '#c03030', // Latvia
  'EE': '#3a7080', // Estonia
  // ── Europe: Eastern Slavic ───────────────────────────────────────────
  'RU': '#ceb561', // Muscovy/Russia ✓
  'UA': '#7cb797', // Ukraine ✓
  'BY': '#3a7a3a', // Belarus
  'MD': '#a07030', // Moldova
  // ── Middle East ──────────────────────────────────────────────────────
  'TR': '#013015', // Ottoman Empire ✓
  'IR': '#8a6020', // Persia
  'IQ': '#8a6020', // Iraq
  'SY': '#8a5020', // Syria
  'SA': '#d0a040', // Arabia
  'YE': '#6a262c', // Yemen ✓
  'AE': '#d0a040', // UAE
  'OM': '#8a4030', // Oman
  'KW': '#d0a040', // Kuwait
  'QA': '#d0a040', // Qatar
  'BH': '#d0a040', // Bahrain
  'JO': '#d0a040', // Jordan
  'IL': '#c8c820', // Levant
  'LB': '#d0a040', // Lebanon
  'GE': '#a04040', // Georgia
  'AM': '#a04040', // Armenia
  'AZ': '#7a8040', // Azerbaijan
  // ── North Africa ─────────────────────────────────────────────────────
  'EG': '#c8a020', // Egypt/Mamluks
  'LY': '#d0682c', // Libya ✓
  'TN': '#c8a040', // Tunisia
  'DZ': '#e6e16e', // Algeria ✓
  'MA': '#c8a020', // Morocco
  'MR': '#c8a040', // Mauritania
  'SD': '#c8a040', // Sudan
  'SS': '#c8a040', // South Sudan
  'ER': '#8a3030', // Eritrea
  // ── Sub-Saharan Africa ───────────────────────────────────────────────
  'ET': '#8a3030', // Ethiopia
  'SO': '#8a3030', // Somalia
  'DJ': '#8a3030', // Djibouti
  'ML': '#a8ae85', // Mali ✓
  'SN': '#a8ae85', // Senegal
  'GN': '#3a7a30', // Guinea
  'GH': '#8a6030', // Ghana
  'NG': '#3c7b41', // Nigeria
  'CD': '#3a6a30', // DR Congo
  'CG': '#3a6a30', // Congo
  'AO': '#3a6a30', // Angola
  'CM': '#3a6a30', // Cameroon
  'TD': '#a8ae85', // Chad
  'CF': '#3a6a30', // CAR
  'GA': '#3a6a30', // Gabon
  'KE': '#5a7a30', // Kenya
  'TZ': '#5a7a30', // Tanzania
  'UG': '#5a7a30', // Uganda
  'RW': '#d5a012', // Rwanda ✓ (RWA)
  'BI': '#5a7a30', // Burundi
  'MZ': '#5a7a30', // Mozambique
  'ZM': '#5a7a30', // Zambia
  'ZW': '#5a7a30', // Zimbabwe
  'BW': '#4a7a80', // Botswana
  'NA': '#4a7a80', // Namibia
  'ZA': '#4a7a80', // South Africa
  'MG': '#8a5050', // Madagascar
  // ── Central Asia ─────────────────────────────────────────────────────
  'KZ': '#c7a0ef', // Kazakhstan ✓
  'UZ': '#ff8600', // Bukhara/Uzbekistan ✓
  'TM': '#c7a0ef', // Turkmenistan
  'KG': '#c7a0ef', // Kyrgyzstan
  'TJ': '#c7a0ef', // Tajikistan
  'AF': '#8a6020', // Afghanistan
  // ── South Asia ───────────────────────────────────────────────────────
  'IN': '#9dc82a', // Delhi/India ✓
  'PK': '#8a6020', // Pakistan
  'BD': '#9dc82a', // Bangladesh
  'NP': '#8a3030', // Nepal
  'LK': '#3c7b41', // Sri Lanka ✓
  'MV': '#3c7b41', // Maldives
  'BT': '#8a6020', // Bhutan
  // ── Southeast Asia ───────────────────────────────────────────────────
  'TH': '#c2ec5b', // Siam ✓
  'MM': '#6e7c9c', // Burma ✓
  'KH': '#ccbac9', // Cambodia ✓
  'VN': '#5a7040', // Vietnam
  'LA': '#c2ec5b', // Laos
  'MY': '#ecf2f3', // Malaya ✓
  'SG': '#ecf2f3', // Singapore
  'ID': '#5a8070', // Indonesia
  'PH': '#4a6080', // Philippines
  'BN': '#ecf2f3', // Brunei
  'TL': '#5a8070', // Timor-Leste
  // ── East Asia ────────────────────────────────────────────────────────
  'CN': '#ed9812', // Qing/China ✓
  'TW': '#ed9812', // Taiwan
  'JP': '#c03535', // Japan
  'KR': '#6090a0', // Korea
  'KP': '#6090a0', // North Korea
  'MN': '#b38068', // Mongolia ✓
  // ── Americas: North ──────────────────────────────────────────────────
  'MX': '#309515', // Aztec/Mexico ✓
  'US': '#4a90c0', // USA
  'CA': '#4a90c0', // Canada
  'GT': '#309515', // Guatemala
  'BZ': '#309515', // Belize
  'HN': '#309515', // Honduras
  'SV': '#309515', // El Salvador
  'NI': '#309515', // Nicaragua
  'CR': '#309515', // Costa Rica
  'PA': '#309515', // Panama
  'CU': '#4a6080', // Cuba
  'JM': '#4a6080', // Jamaica
  'HT': '#4a6080', // Haiti
  'DO': '#4a6080', // Dominican Republic
  // ── Americas: South ──────────────────────────────────────────────────
  'BR': '#3a9040', // Brazil
  'AR': '#4a8060', // Argentina
  'CL': '#3a7060', // Chile
  'PE': '#7d5c6e', // Inca/Peru ✓
  'CO': '#3a9060', // Colombia
  'VE': '#4a8040', // Venezuela
  'EC': '#3a9060', // Ecuador
  'BO': '#7d5c6e', // Bolivia
  'PY': '#3a7060', // Paraguay
  'UY': '#3a7060', // Uruguay
  'GY': '#3a9060', // Guyana
  'SR': '#3a9060', // Suriname
  // ── Oceania ──────────────────────────────────────────────────────────
  'AU': '#4a7a80', // Australia
  'NZ': '#4a7a80', // New Zealand
  'PG': '#5a7070', // Papua New Guinea
}

/**
 * Builds a MapLibre match expression using EU4 country colors.
 * Countries without a known EU4 color render as EU4_MISSING_COLOR.
 */
export function buildPoliticalExpression(iso2Codes) {
  const colors = {}
  iso2Codes.forEach((code) => {
    // -99 = non-country features (lakes, disputed areas) — blend with background
    colors[code] = code === '-99' ? '#0a0e1a' : (EU4_COLORS[code] ?? EU4_MISSING_COLOR)
  })
  return buildMatchExpression(colors, '#0a0e1a')
}

/**
 * Builds a MapLibre 'match' expression that maps ISO codes to colors.
 * countryColors is an object: { 'NL': '#ff0000', 'DE': '#00ff00', ... }
 * fallbackColor is used for countries with no data.
 */
export function buildMatchExpression(countryColors, fallbackColor = '#1e293b') {
  const expression = ['match', ['get', 'ISO3166-1-Alpha-2']]

  Object.entries(countryColors).forEach(([isoCode, color]) => {
    expression.push(isoCode, color)
  })

  expression.push(fallbackColor) // fallback
  return expression
}
