import useStore from '../store/useStore'

function LoadingOverlay() {
  const loading = useStore((state) => state.loading)

  if (!loading.map) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent
                        rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading world data...</p>
      </div>
    </div>
  )
}

export default LoadingOverlay