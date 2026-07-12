import useStore from '../store/useStore'

export default function ErrorBanner() {
  const lastError  = useStore((s) => s.lastError)
  const clearError = useStore((s) => s.clearError)

  if (!lastError) return null

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50
                    flex items-center gap-3 px-4 py-2.5
                    bg-[#1a0a0a] border border-red-900/60 rounded-lg
                    shadow-lg shadow-black/40 max-w-sm">
      <span className="text-red-400 text-xs leading-snug">{lastError}</span>
      <button
        onClick={clearError}
        className="text-[#4b5563] hover:text-[#94a3b8] text-lg leading-none shrink-0 transition-colors"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
