import { create } from 'zustand'

const useStore = create((set, get) => ({

  // ─── Map ─────────────────────────────────────────────────────────────
  activeLayer: 'population',
  worldData: null,
  fillExpression: '#3b5998',
  allCountriesData: null,

  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setWorldData: (data) => set({ worldData: data }),
  setFillExpression: (expr) => set({ fillExpression: expr }),
  setAllCountriesData: (data) => set({ allCountriesData: data }),

  // ─── Selected country ────────────────────────────────────────────────
  selectedCountry: null,   // { code, name }
  countryData: null,       // REST Countries response
  economyData: null,       // World Bank response

  setSelectedCountry: (country) => set({
    selectedCountry: country,
    countryData: null,
    economyData: null,
    worldBankCountryData: null,
    sidebarOpen: country !== null,
    activeTab: 'economy',
  }),
  setCountryData: (data) => set({ countryData: data }),
  setEconomyData: (data) => set({ economyData: data }),

  // ─── UI ──────────────────────────────────────────────────────────────
  sidebarOpen: false,
  activeTab: 'economy',    // 'economy' | 'geopolitics' | 'conflicts'

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ─── Loading ─────────────────────────────────────────────────────────
  loading: {
    map: true,
    country: false,
  },

  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

    // World Bank layer data cache: { indicator: { ISO2: value, ... } }
    worldBankLayerCache: {},
  setWorldBankLayerData: (indicator, data) =>
    set((state) => ({
        worldBankLayerCache: {
        ...state.worldBankLayerCache,
        [indicator]: data,
      },
    })),

  // World Bank sidebar data for selected country
  worldBankCountryData: null,
  setWorldBankCountryData: (data) => set({ worldBankCountryData: data }),
}))

export default useStore