function LayerSelector({ layers, activeLayer, onLayerChange }) {
  return (
    <div className="absolute top-4 right-4 z-20 bg-gray-900 bg-opacity-90 
                    rounded-lg p-3 flex flex-col gap-2 min-w-36">
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
        Data Layer
      </p>
      {Object.entries(layers).map(([key, layer]) => (
        <button
          key={key}
          onClick={() => onLayerChange(key)}
          className={`text-left text-sm px-3 py-1.5 rounded transition-colors ${
            activeLayer === key
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          {layer.label}
        </button>
      ))}
    </div>
  )
}

export default LayerSelector