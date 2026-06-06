import useStore from '../store/useStore'

function LoadingOverlay() {
  const loading = useStore((state) => state.loading)

  if (!loading.map) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0e1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500/80 border-t-transparent
                        rounded-full animate-spin" />
        <p className="font-display text-[11px] uppercase tracking-[0.2em] text-[#6b7280]">
          Loading world data
        </p>
      </div>
    </div>
  )
}

export default LoadingOverlay