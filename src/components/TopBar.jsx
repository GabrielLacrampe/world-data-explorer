import useStore from '../store/useStore'

function TopBar({ layers }) {
  const { activeLayer, setActiveLayer } = useStore()

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-12
                    bg-[#0d1117] bg-opacity-90 backdrop-blur-md
                    border-b border-[#1e2736]
                    flex items-center px-5 gap-6">

      <span className="font-display text-sm tracking-widest text-[#94a3b8] uppercase select-none whitespace-nowrap shrink-0">
        World Data Explorer
      </span>

      <div className="w-px h-5 bg-[#1e2736]" />

      <div className="flex items-center gap-1">
        {Object.entries(layers).map(([key, layer]) => (
          <button
            key={key}
            onClick={() => setActiveLayer(key)}
            className={`px-3 py-1 text-xs rounded transition-all duration-150 ${
              activeLayer === key
                ? 'bg-blue-600/90 text-white shadow-sm shadow-blue-900/50'
                : 'text-[#6b7280] hover:text-[#e2e8f0] hover:bg-[#1e2736]'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TopBar