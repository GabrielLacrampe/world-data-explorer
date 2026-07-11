import { create } from 'zustand'

const useStore = create((set) => ({

  // ─── Map ─────────────────────────────────────────────────────────────
  activeLayer: 'political',
  worldData: null,
  mapZoom: 1.8,
  setMapZoom: (z) => set({ mapZoom: z }),
  fillExpression: '#3b5998',
  allCountriesData: null,

  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setWorldData: (data) => set({ worldData: data }),
  setFillExpression: (expr) => set({ fillExpression: expr }),
  setAllCountriesData: (data) => set({ allCountriesData: data }),

  // ─── Selected country ────────────────────────────────────────────────
  selectedCountry: null,   // { code, name }
  countryData: null,       // REST Countries response

  setSelectedCountry: (country) => set({
    selectedCountry: country,
    countryData: null,
    worldBankCountryData: null,
    // keep sidebar open if already open and selecting a new country; close on deselect
    sidebarOpen: country !== null,
    countryLoadError: false,
  }),
  setCountryData: (data) => set({ countryData: data }),

  // ─── UI ──────────────────────────────────────────────────────────────
  sidebarOpen: false,
  activeTab: 'gobierno',

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ─── Loading ─────────────────────────────────────────────────────────
  loading: {
    map: true,
    country: false,
  },
  countryLoadError: false,

  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),
  setCountryLoadError: (val) => set({ countryLoadError: val }),

    // World Bank layer data cache: { indicator: { ISO2: value, ... } }
    worldBankLayerCache: {},
  setWorldBankLayerData: (indicator, data) =>
    set((state) => ({
        worldBankLayerCache: {
        ...state.worldBankLayerCache,
        [indicator]: data,
      },
    })),

  // IMF layer data cache: { indicator: { ISO3: value, ... } }
  imfLayerCache: {},
  setImfLayerData: (indicator, data) =>
    set((state) => ({
      imfLayerCache: { ...state.imfLayerCache, [indicator]: data },
    })),

  // World Bank sidebar data for selected country
  worldBankCountryData: null,
  setWorldBankCountryData: (data) => set({ worldBankCountryData: data }),
  worldBankCountryLoading: false,
  setWorldBankCountryLoading: (val) => set({ worldBankCountryLoading: val }),

  // ─── Layer loading ───────────────────────────────────────────────────
  layerLoading: false,
  setLayerLoading: (val) => set({ layerLoading: val }),

  // ─── Errors ──────────────────────────────────────────────────────────
  lastError: null,
  setLastError: (msg) => set({ lastError: msg }),
  clearError: () => set({ lastError: null }),

  // ─── Static datasets ─────────────────────────────────────────────────
  staticData: null,
  setStaticData: (data) => set({ staticData: data }),

  // ─── Trade routes ─────────────────────────────────────────────────────
  tradeGeoJSON: null,
  setTradeGeoJSON: (data) => set({ tradeGeoJSON: data }),

  // ─── Historical time slider ───────────────────────────────────────────
  // historicalData: { [owidChart]: { [year]: { [iso2]: value } } }
  historicalData: {},
  setHistoricalData: (chart, data) =>
    set((state) => ({
      historicalData: { ...state.historicalData, [chart]: data },
    })),

  activeYear: null,           // null = slider inactive; number = selected year
  setActiveYear: (year) => set({ activeYear: year }),

  isPlaying: false,
  setIsPlaying: (val) => set({ isPlaying: val }),

  historicalLoading: false,
  setHistoricalLoading: (val) => set({ historicalLoading: val }),

  // ─── Combine mode (multi-layer blend) ─────────────────────────────────
  combineMode: false,
  combinedLayers: [],   // array of layer keys, insertion order preserved
  setCombineMode: (on) => set({ combineMode: on }),
  toggleCombinedLayer: (key) =>
    set((state) => ({
      combinedLayers: state.combinedLayers.includes(key)
        ? state.combinedLayers.filter((k) => k !== key)
        : [...state.combinedLayers, key],
    })),
  removeCombinedLayer: (key) =>
    set((state) => ({ combinedLayers: state.combinedLayers.filter((k) => k !== key) })),
  clearCombinedLayers: () => set({ combinedLayers: [] }),
}))

export default useStore