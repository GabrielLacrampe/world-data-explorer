import useStore from '../store/useStore'

// Overlay definitions — add new overlays here in the future
const OVERLAYS = {
  conflicts: {
    label: 'Conflicts',
    color: '#ef4444',  // red dot indicator when active
  },
  // future: bases: { label: 'Military Bases', color: '#f97316' }
  // future: disasters: { label: 'Disasters', color: '#eab308' }
}

function TopBar({ layers }) {
  const { activeLayer, setActiveLayer, overlays, toggleOverlay  } = useStore()

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-12
                    bg-gray-950 bg-opacity-80 backdrop-blur-sm
                    border-b border-gray-800
                    flex items-center px-4 gap-6">

      <span className="text-gray-400 text-xs uppercase tracking-widest font-medium
                       shrink-0">
        World Data Explorer
      </span>

      {/* ── Base layer selector ──────────────────────────────── */}
      <div className="flex items-center gap-1 flex-1 overflow-x-auto">
        {Object.entries(layers).map(([key, layer]) => (
          <button
            key={key}
            onClick={() => setActiveLayer(key)}
            className={`px-3 py-1 text-xs rounded transition-colors shrink-0 ${
              activeLayer === key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="h-5 w-px bg-gray-700 shrink-0" />

      {/* ── Overlay toggles ──────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {Object.entries(OVERLAYS).map(([key, overlay]) => {
          const isActive = overlays[key]?.active ?? false
          const isLoading = overlays[key]?.loading ?? false

          return (
            <button
              key={key}
              onClick={() => toggleOverlay(key)}
              className={`px-3 py-1 text-xs rounded transition-colors
                          flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-gray-800 text-white border border-gray-600'
                  : 'text-gray-500 hover:text-white hover:bg-gray-800'
              }`}
            >
              {isLoading ? (
                <div className="w-2 h-2 border border-gray-400 border-t-transparent
                                rounded-full animate-spin" />
              ) : (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isActive ? overlay.color : '#4b5563' }}
                />
              )}
              {overlay.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TopBar