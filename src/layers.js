export const LAYERS = {
  // ── Existing layers ──────────────────────────────────────────────────
  geographic: { label: 'Geographic', property: null, unit: '', source: 'none' },
  political:  { label: 'Political',  property: null, unit: '', source: 'static' },
  population: {
    label: 'Population',
    property: 'population',
    unit: 'people',
    source: 'restcountries',
    attribution: 'REST Countries',
  },
  area: {
    label: 'Area',
    property: 'area',
    unit: 'km²',
    source: 'restcountries',
    attribution: 'REST Countries',
  },

  // ── World Bank layers ────────────────────────────────────────────────
  gdp_per_capita: {
    label: 'GDP per Capita',
    indicator: 'NY.GDP.PCAP.CD',
    unit: 'USD',
    source: 'worldbank',
    format: 'currency',
    attribution: 'World Bank',
  },
  gdp_growth: {
    label: 'GDP Growth',
    indicator: 'NY.GDP.MKTP.KD.ZG',
    unit: '%',
    source: 'worldbank',
    format: 'percent',
    attribution: 'World Bank',
  },
  unemployment: {
    label: 'Unemployment',
    indicator: 'SL.UEM.TOTL.ZS',
    unit: '% of labor force',
    source: 'worldbank',
    format: 'percent',
    attribution: 'World Bank',
  },
  life_expectancy: {
    label: 'Life Expectancy',
    indicator: 'SP.DYN.LE00.IN',
    unit: 'years',
    source: 'worldbank',
    format: 'decimal',
    attribution: 'World Bank',
  },
  co2_per_capita: {
    label: 'CO₂ per Capita',
    indicator: 'EN.ATM.CO2E.PC',
    unit: 'tonnes',
    source: 'worldbank',
    format: 'decimal',
    attribution: 'World Bank',
  },
  military_spending: {
    label: 'Military Spending',
    indicator: 'MS.MIL.XPND.GD.ZS',
    unit: '% of GDP',
    source: 'worldbank',
    format: 'percent',
    attribution: 'World Bank',
  },

  // ── Static dataset layers ────────────────────────────────────────────
  democracy_index: {
    label: 'Democracy Index',
    unit: 'V-Dem score',
    source: 'static',
    staticKey: 'vdem',
    format: 'decimal',
    scale: 'linear',
    attribution: 'V-Dem Institute',
  },

  // ── Diplomatic layers ────────────────────────────────────────────────
  alliances: {
    label: 'Alliances',
    source: 'diplomatic',
    attribution: 'COW Project',
  },
}

export const SIDEBAR_INDICATORS = [
  { indicator: 'SP.POP.TOTL',         label: 'Population',          format: 'integer', unit: '' },
  { indicator: 'NY.GDP.PCAP.CD',      label: 'GDP per Capita',      format: 'currency', unit: 'USD' },
  { indicator: 'NY.GDP.MKTP.KD.ZG',  label: 'GDP Growth',          format: 'percent', unit: '%' },
  { indicator: 'SL.UEM.TOTL.ZS',     label: 'Unemployment',        format: 'percent', unit: '%' },
  { indicator: 'FP.CPI.TOTC.ZG',     label: 'Inflation',           format: 'percent', unit: '%' },
  { indicator: 'SI.POV.GINI',        label: 'Gini Index',          format: 'decimal', unit: '' },
  { indicator: 'SP.DYN.LE00.IN',     label: 'Life Expectancy',     format: 'decimal', unit: 'years' },
  { indicator: 'SE.ADT.LITR.ZS',     label: 'Literacy Rate',       format: 'percent', unit: '%' },
  { indicator: 'IT.NET.USER.ZS',     label: 'Internet Users',      format: 'percent', unit: '%' },
  { indicator: 'EG.ELC.ACCS.ZS',     label: 'Electricity Access',  format: 'percent', unit: '%' },
  { indicator: 'EG.FEC.RNEW.ZS',     label: 'Renewable Energy',    format: 'percent', unit: '%' },
  { indicator: 'EN.ATM.CO2E.PC',     label: 'CO₂ per Capita',      format: 'decimal', unit: 'tonnes' },
  { indicator: 'MS.MIL.XPND.GD.ZS', label: 'Military Spending',   format: 'percent', unit: '% of GDP' },
]
