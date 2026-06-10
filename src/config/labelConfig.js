// ─── Country label tuning ────────────────────────────────────────────────────
export const LABEL_BASE_SIZE    = 10    // default px size (countries without override)
export const LABEL_REF_ZOOM     = 3     // zoom where LABEL_BASE_SIZE applies (exponential anchor)

// ── Zoom landmarks (adjust these to taste) ───────────────────────────────────
export const LABEL_LARGE_SHOW   = 0.0   // zoom where override (large) labels appear
export const LABEL_DEFAULT_SHOW = 3.0   // zoom where default-size labels appear
export const LABEL_FADE_IN      = 0.5   // zoom range to fully fade in after appearing
export const LABEL_FADE_START   = 4.5   // zoom where ALL labels start fading out
export const LABEL_FADE_END     = 5.0   // zoom where ALL labels are completely gone
// ─────────────────────────────────────────────────────────────────────────────

// Per-country overrides (ISO2 key).
// size   — px at zoom LABEL_REF_ZOOM.
// offset — [lngDelta, latDelta] in degrees from the polygon centroid.
//          +lng = east, -lng = west, +lat = north, -lat = south.
// rotate — degrees clockwise (e.g. -30 tilts label to the left/NW, +30 to the right/NE).
//          Use to align labels with elongated territories.
export const LABEL_OVERRIDES = {
  // ── Tier 1 · Giant  > 8M km² ─────────────────────────────────────────────
  'RU': { size: 135, offset: [-40,  0 ] },  // Russia
  'CA': { size:  75, offset: [  0, -8 ] },  // Canada
  'US': { size:  45, offset: [-10,  3 ] },  // United States
  'CN': { size:  55, offset: [-10,  2 ] },  // China
  'BR': { size:  50, offset: [  0,  2 ] },  // Brazil
  'AU': { size:  50, offset: [  0,  0 ] },  // Australia

  // ── Tier 2 · Very large  2–8M km² ────────────────────────────────────────
  'IN': { size:  32, offset: [  0,  2 ] },  // India
  'AR': { size:  38, offset: [  0,  5 ] },  // Argentina
  'KZ': { size:  42, offset: [  5,  0 ] },  // Kazakhstan
  'DZ': { size:  35, offset: [  0,  0 ] },  // Algeria
  'CD': { size:  35, offset: [  0,  0 ] },  // DR Congo
  'SA': { size:  30, offset: [  0,  0 ] },  // Saudi Arabia
  'MX': { size:  28, offset: [ -3,  2 ] },  // Mexico
  'ID': { size:  18, offset: [  5,  0 ] },  // Indonesia
  'GL': { size:  38, offset: [  0, -8 ] },  // Greenland

  // ── Tier 3 · Large  1–2M km² ─────────────────────────────────────────────
  'SD': { size:  28, offset: [  0,  0 ] },  // Sudan
  'LY': { size:  28, offset: [  0,  0 ] },  // Libya
  'IR': { size:  26, offset: [  0,  0 ] },  // Iran
  'MN': { size:  30, offset: [  0,  0 ] },  // Mongolia
  'PE': { size:  24, offset: [  0,  0 ] },  // Peru
  'TD': { size:  24, offset: [  0,  0 ] },  // Chad
  'NE': { size:  24, offset: [  0,  0 ] },  // Niger
  'AO': { size:  24, offset: [  0,  0 ] },  // Angola
  'ML': { size:  24, offset: [  0,  0 ] },  // Mali
  'ZA': { size:  24, offset: [  0,  0 ] },  // South Africa
  'CO': { size:  22, offset: [  0,  0 ] },  // Colombia
  'ET': { size:  24, offset: [  0,  0 ] },  // Ethiopia
  'BO': { size:  22, offset: [  0,  0 ] },  // Bolivia
  'MR': { size:  24, offset: [  0,  0 ] },  // Mauritania

  // ── Tier 4 · Medium-large  500K–1M km² ───────────────────────────────────
  'EG': { size:  20, offset: [  0,  0 ] },  // Egypt
  'TZ': { size:  20, offset: [  0,  0 ] },  // Tanzania
  'NG': { size:  18, offset: [  0,  0 ] },  // Nigeria
  'VE': { size:  20, offset: [  0,  0 ] },  // Venezuela
  'NA': { size:  20, offset: [  0,  0 ] },  // Namibia
  'MZ': { size:  18, offset: [  0,  0 ] },  // Mozambique
  'PK': { size:  18, offset: [  0,  0 ] },  // Pakistan
  'TR': { size:  18, offset: [  3,  0 ] },  // Turkey
  'CL': { size:  13, offset: [  0,  5 ], rotate: -15 },  // Chile — thin N-S strip
  'ZM': { size:  18, offset: [  0,  0 ] },  // Zambia
  'MM': { size:  18, offset: [  0,  0 ] },  // Myanmar
  'AF': { size:  18, offset: [  0,  0 ] },  // Afghanistan
  'SO': { size:  18, offset: [  0,  0 ] },  // Somalia
  'CF': { size:  18, offset: [  0,  0 ] },  // Central African Republic
  'SS': { size:  18, offset: [  0,  0 ] },  // South Sudan
  'UA': { size:  18, offset: [  0,  0 ] },  // Ukraine
  'MG': { size:  15, offset: [  0,  0 ] },  // Madagascar
  'BW': { size:  18, offset: [  0,  0 ] },  // Botswana
  'KE': { size:  18, offset: [  0,  0 ] },  // Kenya
  'FR': { size:  16, offset: [  2,  0 ] },  // France
  'YE': { size:  18, offset: [  0,  0 ] },  // Yemen

  // ── Tier 5 · Medium  200–500K km² ────────────────────────────────────────
  'TH': { size:  15, offset: [  0,  0 ] },  // Thailand
  'ES': { size:  13, offset: [  0, -1 ] },  // Spain
  'CM': { size:  15, offset: [  0,  0 ] },  // Cameroon
  'SE': { size:  14, offset: [  0, -2 ], rotate: -20 },  // Sweden — runs N-S
  'UZ': { size:  15, offset: [  0,  0 ] },  // Uzbekistan
  'MA': { size:  15, offset: [  0,  0 ] },  // Morocco
  'IQ': { size:  15, offset: [  0,  0 ] },  // Iraq
  'PY': { size:  15, offset: [  0,  0 ] },  // Paraguay
  'ZW': { size:  14, offset: [  0,  0 ] },  // Zimbabwe
  'JP': { size:  13, offset: [  0,  0 ] },  // Japan
  'DE': { size:  13, offset: [  0,  0 ] },  // Germany
  'CG': { size:  14, offset: [  0,  0 ] },  // Republic of Congo
  'FI': { size:  13, offset: [  0, -2 ] },  // Finland
  'VN': { size:  13, offset: [  0,  2 ], rotate: -20 },  // Vietnam — long N-S strip
  'MY': { size:  13, offset: [  2,  0 ] },  // Malaysia
  'NO': { size:  13, offset: [  2, -3 ], rotate: -25 },  // Norway — runs NW-SE
  'CI': { size:  14, offset: [  0,  0 ] },  // Ivory Coast
  'PL': { size:  13, offset: [  0,  0 ] },  // Poland
  'OM': { size:  14, offset: [  0,  0 ] },  // Oman
  'IT': { size:  13, offset: [  0,  0 ], rotate: -30 },  // Italy — runs NW-SE
  'PG': { size:  14, offset: [  0,  0 ] },  // Papua New Guinea
  'EC': { size:  14, offset: [  0,  0 ] },  // Ecuador
  'BF': { size:  14, offset: [  0,  0 ] },  // Burkina Faso
  'TM': { size:  15, offset: [  0,  0 ] },  // Turkmenistan
  'GA': { size:  14, offset: [  0,  0 ] },  // Gabon
  'GN': { size:  13, offset: [  0,  0 ] },  // Guinea
  'GH': { size:  13, offset: [  0,  0 ] },  // Ghana

  // ── Tier 6 · Small–medium  50–200K km² ───────────────────────────────────
  'RO': { size:  13, offset: [  0,  0 ] },  // Romania
  'LA': { size:  13, offset: [  0,  0 ] },  // Laos
  'UG': { size:  13, offset: [  0,  0 ] },  // Uganda
  'SN': { size:  13, offset: [  0,  0 ] },  // Senegal
  'KG': { size:  13, offset: [  0,  0 ] },  // Kyrgyzstan
  'TJ': { size:  13, offset: [  0,  0 ] },  // Tajikistan
  'SY': { size:  13, offset: [  0,  0 ] },  // Syria
  'KH': { size:  13, offset: [  0,  0 ] },  // Cambodia
  'PH': { size:  13, offset: [  0,  0 ] },  // Philippines
  'NZ': { size:  12, offset: [  0,  0 ] },  // New Zealand
  'IS': { size:  12, offset: [  0,  0 ] },  // Iceland
  'BY': { size:  12, offset: [  0,  0 ] },  // Belarus
  'GB': { size:  12, offset: [  0,  0 ] },  // United Kingdom
  'CU': { size:  12, offset: [  0,  0 ] },  // Cuba
  'GY': { size:  13, offset: [  0,  0 ] },  // Guyana
  'SR': { size:  12, offset: [  0,  0 ] },  // Suriname
  'UY': { size:  12, offset: [  0,  0 ] },  // Uruguay
  'TN': { size:  12, offset: [  0,  0 ] },  // Tunisia
  'NI': { size:  12, offset: [  0,  0 ] },  // Nicaragua
  'BD': { size:  12, offset: [  0,  0 ] },  // Bangladesh
  'MW': { size:  11, offset: [  0,  0 ] },  // Malawi
  'ER': { size:  11, offset: [  0,  0 ] },  // Eritrea
  'JO': { size:  11, offset: [  0,  0 ] },  // Jordan
  'AZ': { size:  11, offset: [  0,  0 ] },  // Azerbaijan
  'AT': { size:  11, offset: [  0,  0 ] },  // Austria
  'GT': { size:  11, offset: [  0,  0 ] },  // Guatemala
  'PT': { size:  11, offset: [  0,  0 ] },  // Portugal
  'HN': { size:  11, offset: [  0,  0 ] },  // Honduras
  'AE': { size:  11, offset: [  0,  0 ] },  // UAE
  'NP': { size:  11, offset: [  0,  0 ] },  // Nepal
  'KP': { size:  11, offset: [  0,  0 ] },  // North Korea
  'KR': { size:  11, offset: [  0,  0 ] },  // South Korea
  'GE': { size:  11, offset: [  0,  0 ] },  // Georgia
  'IE': { size:  11, offset: [  0,  0 ] },  // Ireland
  'CR': { size:  11, offset: [  0,  0 ] },  // Costa Rica
  'PA': { size:  11, offset: [  0,  0 ] },  // Panama
  'LK': { size:  10, offset: [  0,  0 ] },  // Sri Lanka
  'HU': { size:  10, offset: [  0,  0 ] },  // Hungary
  'RS': { size:  10, offset: [  0,  0 ] },  // Serbia
  'BG': { size:  10, offset: [  0,  0 ] },  // Bulgaria
  'SK': { size:  10, offset: [  0,  0 ] },  // Slovakia
  'DK': { size:  10, offset: [  0,  0 ] },  // Denmark
  'HR': { size:  10, offset: [  0,  0 ] },  // Croatia
  'LT': { size:  10, offset: [  0,  0 ] },  // Lithuania
  'LV': { size:  10, offset: [  0,  0 ] },  // Latvia
  'EE': { size:  10, offset: [  0,  0 ] },  // Estonia
  'BA': { size:  10, offset: [  0,  0 ] },  // Bosnia and Herzegovina
  'AL': { size:  10, offset: [  0,  0 ] },  // Albania
  'MD': { size:  10, offset: [  0,  0 ] },  // Moldova
  'GR': { size:  10, offset: [  0,  0 ] },  // Greece
  'CZ': { size:  10, offset: [  0,  0 ] },  // Czechia
  'CH': { size:  10, offset: [  0,  0 ] },  // Switzerland
  'NL': { size:  10, offset: [  0,  0 ] },  // Netherlands
  'BE': { size:  10, offset: [  0,  0 ] },  // Belgium
  'AM': { size:  10, offset: [  0,  0 ] },  // Armenia
  'IL': { size:  10, offset: [  0,  0 ] },  // Israel
  'LB': { size:  10, offset: [  0,  0 ] },  // Lebanon
  'CY': { size:  10, offset: [  0,  0 ] },  // Cyprus
  'KW': { size:  10, offset: [  0,  0 ] },  // Kuwait
  'ME': { size:  10, offset: [  0,  0 ] },  // Montenegro
  'SI': { size:  10, offset: [  0,  0 ] },  // Slovenia
  'MK': { size:  10, offset: [  0,  0 ] },  // North Macedonia
  'DO': { size:  10, offset: [  0,  0 ] },  // Dominican Republic
  'HT': { size:  10, offset: [  0,  0 ] },  // Haiti
  'SV': { size:  10, offset: [  0,  0 ] },  // El Salvador
  'BZ': { size:  10, offset: [  0,  0 ] },  // Belize
  'TT': { size:  10, offset: [  0,  0 ] },  // Trinidad and Tobago
  'JM': { size:  10, offset: [  0,  0 ] },  // Jamaica
  'TL': { size:  10, offset: [  0,  0 ] },  // Timor-Leste
  'BN': { size:  10, offset: [  0,  0 ] },  // Brunei
  'BT': { size:  10, offset: [  0,  0 ] },  // Bhutan
  'TW': { size:  10, offset: [  0,  0 ] },  // Taiwan
  'RW': { size:  10, offset: [  0,  0 ] },  // Rwanda
  'BI': { size:  10, offset: [  0,  0 ] },  // Burundi
  'DJ': { size:  10, offset: [  0,  0 ] },  // Djibouti
  'SZ': { size:  10, offset: [  0,  0 ] },  // Eswatini
  'GW': { size:  10, offset: [  0,  0 ] },  // Guinea-Bissau
  'SL': { size:  10, offset: [  0,  0 ] },  // Sierra Leone
  'LR': { size:  10, offset: [  0,  0 ] },  // Liberia
  'TG': { size:  10, offset: [  0,  0 ] },  // Togo
  'BJ': { size:  10, offset: [  0,  0 ] },  // Benin
  'MU': { size:  10, offset: [  0,  0 ] },  // Mauritius
  'KM': { size:  10, offset: [  0,  0 ] },  // Comoros
  'CV': { size:  10, offset: [  0,  0 ] },  // Cape Verde
  'SC': { size:  10, offset: [  0,  0 ] },  // Seychelles
  'LS': { size:  10, offset: [  0,  0 ] },  // Lesotho
  'GQ': { size:  10, offset: [  0,  0 ] },  // Equatorial Guinea
  'ST': { size:  10, offset: [  0,  0 ] },  // São Tomé and Príncipe
  'QA': { size:  10, offset: [  0,  0 ] },  // Qatar
  'BH': { size:  10, offset: [  0,  0 ] },  // Bahrain
  'LU': { size:  10, offset: [  0,  0 ] },  // Luxembourg
  'FJ': { size:  10, offset: [  0,  0 ] },  // Fiji
  'SB': { size:  10, offset: [  0,  0 ] },  // Solomon Islands
  'VU': { size:  10, offset: [  0,  0 ] },  // Vanuatu
  'WS': { size:  10, offset: [  0,  0 ] },  // Samoa
  'TO': { size:  10, offset: [  0,  0 ] },  // Tonga
  'FM': { size:  10, offset: [  0,  0 ] },  // Micronesia
  'KI': { size:  10, offset: [  0,  0 ] },  // Kiribati
  'MH': { size:  10, offset: [  0,  0 ] },  // Marshall Islands
  'NR': { size:  10, offset: [  0,  0 ] },  // Nauru
}

export const ALLIANCE_COLORS = {
  'Defense Pact':          '#ef4444',
  'Non-Aggression Treaty': '#f59e0b',
  'Neutrality Pact':       '#a78bfa',
  'Entente':               '#22c55e',
}
