import useStore from '../../store/useStore'

function TopBar({ layers }) {
  const { activeLayer, setActiveLayer } = useStore()

  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-12
                    bg-gray-950 bg-opacity-80 backdrop-blur-sm
                    border-b border-gray-800
                    flex items-center px-4 gap-6">

      <span className="text-gray-400 text-xs uppercase tracking-widest font-medium">
        World Data Explorer
      </span>

      <div className="flex items-center gap-1">
        {Object.entries(layers).map(([key, layer]) => (
          <button
            key={key}
            onClick={() => setActiveLayer(key)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeLayer === key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
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