import { motion } from 'framer-motion'

/** Compact safe/unsafe route switcher — pairs with StartRouteBar below. */
export default function MobileRouteBar({
  routes,
  safetyScores,
  selectedRouteIndex,
  onRouteSelect,
  onExpandSheet,
}) {
  if (!routes.length) return null

  return (
    <motion.div
      className="absolute left-0 right-0 z-[27] pointer-events-none"
      style={{ bottom: 'calc(148px + env(safe-area-inset-bottom))' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mx-3 pointer-events-auto flex gap-2">
        {routes.map((_, i) => {
          const safety = safetyScores[i]
          const isSafe = safety?.isRecommended
          const color = isSafe ? '#22C55E' : '#EF4444'
          const selected = i === selectedRouteIndex
          return (
            <button
              key={i}
              type="button"
              onClick={() => onRouteSelect(i)}
              className={`flex-1 min-h-[48px] rounded-xl border px-2 py-2 text-left touch-manipulation transition-all ${
                selected ? 'ring-2 ring-offset-1 ring-offset-[#0a1628]' : ''
              }`}
              style={{
                borderColor: color + (selected ? 'cc' : '40'),
                background: color + (selected ? '20' : '0c'),
                ringColor: color,
              }}
            >
              <p className="text-[10px] font-black uppercase" style={{ color }}>
                {isSafe ? '✦ Safe' : '⚠ Unsafe'}
              </p>
              <p className="text-white text-xs font-bold truncate">{safety?.routeLabel}</p>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onExpandSheet}
          className="w-12 min-h-[48px] rounded-xl glass border border-white/10 text-gray-400 text-xs font-bold touch-manipulation flex-shrink-0"
          aria-label="Route details"
        >
          ···
        </button>
      </div>
    </motion.div>
  )
}
