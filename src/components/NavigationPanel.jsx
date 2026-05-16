import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration, formatDistance } from '../services/routingService'

export default function NavigationPanel({
  destination,
  route,
  isUnsafeRoute,
  currentStep,
  nextStep,
  stepIndex,
  totalSteps,
  progress,
  distanceRemaining,
  etaSeconds,
  safetyUpdate,
  onDismissSafetyUpdate,
  onEnd,
  onReroute,
}) {
  const routeColor = isUnsafeRoute ? '#EF4444' : '#22C55E'
  const progressPct = Math.round(progress * 100)

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none"
      initial={{ y: 120 }}
      animate={{ y: 0 }}
      exit={{ y: 120 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
    >
      {/* Safety update toast */}
      <AnimatePresence>
        {safetyUpdate && (
          <motion.div
            className="mx-4 mb-3 pointer-events-auto rounded-2xl border px-4 py-3 flex items-start gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            style={{
              background: safetyUpdate.type === 'danger'
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(34,197,94,0.12)',
              borderColor: safetyUpdate.type === 'danger' ? '#EF444466' : '#22C55E66',
            }}
          >
            <span className="text-xl flex-shrink-0">
              {safetyUpdate.type === 'danger' ? '🚨' : '✓'}
            </span>
            <motion.div
              className="flex-1 min-w-0"
              animate={safetyUpdate.type === 'danger' ? { opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1, repeat: safetyUpdate.type === 'danger' ? Infinity : 0 }}
            >
              <p className="text-white text-sm font-semibold leading-snug">{safetyUpdate.message}</p>
              {safetyUpdate.action && (
                <p className="text-gray-400 text-xs mt-0.5">{safetyUpdate.action}</p>
              )}
            </motion.div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {safetyUpdate.type === 'danger' && onReroute && (
                <button
                  onClick={onReroute}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-safe/20 text-safe border border-safe/40"
                >
                  Reroute
                </button>
              )}
              <button
                onClick={onDismissSafetyUpdate}
                className="text-gray-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main navigation card */}
      <motion.div
        className="pointer-events-auto mx-0 rounded-t-3xl border-t border-white/10 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(17,24,39,0.97) 0%, rgba(8,12,20,0.99) 100%)',
          backdropFilter: 'blur(24px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
        }}
      >
        {/* Progress bar */}
        <motion.div
          className="h-1 w-full bg-white/5"
          style={{ originX: 0 }}
        >
          <motion.div
            className="h-full"
            style={{
              background: `linear-gradient(90deg, ${routeColor}, ${routeColor}aa)`,
              boxShadow: `0 0 12px ${routeColor}88`,
              width: `${progressPct}%`,
            }}
            animate={{ boxShadow: [`0 0 8px ${routeColor}66`, `0 0 16px ${routeColor}cc`, `0 0 8px ${routeColor}66`] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        <motion.div
          className="absolute top-3 left-0 right-0 h-px opacity-30"
          style={{ background: `linear-gradient(90deg, transparent, ${routeColor}, transparent)` }}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        <motion.div className="px-5 pt-5 pb-4">
          {/* Turn instruction — hero */}
          <div className="flex items-start gap-4 mb-4">
            <motion.div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 border"
              style={{
                backgroundColor: routeColor + '18',
                borderColor: routeColor + '55',
                color: routeColor,
                boxShadow: `0 0 20px ${routeColor}33`,
              }}
              key={stepIndex}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              {currentStep?.icon ?? '→'}
            </motion.div>
            <div className="flex-1 min-w-0 pt-0.5">
              <motion.p
                key={`inst-${stepIndex}`}
                className="text-white font-black text-2xl leading-tight"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {currentStep?.instruction ?? 'Follow route'}
              </motion.p>
              <p className="text-gray-400 text-sm mt-1 truncate">
                {currentStep?.detail ?? destination?.name}
              </p>
              {nextStep && (
                <p className="text-gray-600 text-xs mt-2">
                  Then: {nextStep.instruction} {nextStep.detail}
                </p>
              )}
            </div>
            <button
              onClick={onEnd}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/15 transition-colors text-sm"
              title="End navigation"
            >
              ✕
            </button>
          </div>

          {/* Stats row */}
          <motion.div
            className="grid grid-cols-3 gap-2 mb-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {[
              { val: formatDuration(etaSeconds), lbl: 'ETA', accent: true },
              { val: formatDistance(distanceRemaining), lbl: 'Remaining' },
              { val: `${progressPct}%`, lbl: 'Progress' },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl py-2.5 px-2 text-center border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <p
                  className="text-sm font-bold tabular-nums"
                  style={{ color: item.accent ? routeColor : '#F8FAFC' }}
                >
                  {item.val}
                </p>
                <p className="text-[10px] text-gray-600 mt-0.5">{item.lbl}</p>
              </div>
            ))}
          </motion.div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-2"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: routeColor, boxShadow: `0 0 8px ${routeColor}` }}
              />
              <span className="text-xs font-semibold" style={{ color: routeColor }}>
                {isUnsafeRoute ? 'Unsafe route · stay alert' : 'HerWay safe navigation'}
              </span>
            </motion.div>
            <p className="text-gray-600 text-[10px] truncate max-w-[140px]">
              → {destination?.name}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
