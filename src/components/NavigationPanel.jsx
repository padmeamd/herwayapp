import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration, formatDistance } from '../services/routingService'

export default function NavigationPanel({
  destination,
  isUnsafeRoute,
  currentStep,
  nextStep,
  stepIndex,
  steps = [],
  progress,
  distanceRemaining,
  etaSeconds,
  safetyUpdate,
  isComplete,
  phase,
  onDismissSafetyUpdate,
  onEnd,
  onReroute,
}) {
  const [expanded, setExpanded] = useState(false)
  const routeColor = isUnsafeRoute ? '#EF4444' : '#22C55E'
  const progressPct = Math.round(progress * 100)

  if (isComplete) {
    return (
      <motion.div
        className="absolute inset-0 z-[38] flex items-center justify-center p-6 pointer-events-none nav-panel-mobile"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div
          className="pointer-events-auto w-full max-w-sm rounded-3xl border border-safe/40 p-8 text-center shadow-2xl"
          style={{ background: 'linear-gradient(165deg, #0f2918 0%, #111827 100%)' }}
        >
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-white font-black text-2xl mb-2">You&apos;ve arrived</h2>
          <p className="text-gray-400 text-sm mb-6">{destination?.name}</p>
          <button
            type="button"
            onClick={onEnd}
            className="w-full min-h-[48px] rounded-2xl font-bold text-white touch-manipulation"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}
          >
            Done
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 z-[38] pointer-events-none nav-panel-mobile"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
    >
      <AnimatePresence>
        {safetyUpdate && (
          <motion.div
            className="mx-3 mb-2 pointer-events-auto rounded-2xl border px-4 py-3 flex items-start gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            style={{
              background: safetyUpdate.type === 'danger'
                ? 'rgba(239,68,68,0.18)'
                : 'rgba(34,197,94,0.12)',
              borderColor: safetyUpdate.type === 'danger' ? '#EF444466' : '#22C55E66',
            }}
          >
            <span className="text-xl flex-shrink-0 animate-pulse">
              {safetyUpdate.type === 'danger' ? '🚨' : '✓'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-snug">{safetyUpdate.message}</p>
              {safetyUpdate.action && (
                <p className="text-gray-400 text-xs mt-0.5">{safetyUpdate.action}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {safetyUpdate.type === 'danger' && onReroute && (
                <button
                  type="button"
                  onClick={onReroute}
                  className="text-xs font-bold px-3 py-2 rounded-full bg-safe/20 text-safe border border-safe/40 touch-manipulation"
                >
                  Reroute
                </button>
              )}
              <button
                type="button"
                onClick={onDismissSafetyUpdate}
                className="text-gray-500 hover:text-white text-sm touch-manipulation min-w-[32px] min-h-[32px]"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="pointer-events-auto rounded-t-3xl border-t border-white/10 overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
        style={{
          background: 'linear-gradient(180deg, rgba(17,24,39,0.98) 0%, rgba(8,12,20,1) 100%)',
          backdropFilter: 'blur(24px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.12}
        onDragEnd={(_, info) => {
          if (info.offset.y < -40) setExpanded(true)
          if (info.offset.y > 60) setExpanded(false)
        }}
      >
        <div className="flex justify-center py-2.5 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {phase === 'starting' && (
          <div className="px-5 pb-2 flex items-center gap-2">
            <span className="text-sm animate-pulse" style={{ color: routeColor }}>●</span>
            <span className="text-gray-400 text-sm font-medium">Starting navigation…</span>
          </div>
        )}

        <div className="h-1 w-full bg-white/5">
          <motion.div
            className="h-full"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${routeColor}, ${routeColor}99)`,
              boxShadow: `0 0 12px ${routeColor}88`,
            }}
            layout
          />
        </div>

        <div className="px-4 pt-4 pb-2">
          <motion.div className="flex items-start gap-3 mb-3">
            <motion.div
              key={stepIndex}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black flex-shrink-0 border"
              style={{
                backgroundColor: routeColor + '18',
                borderColor: routeColor + '55',
                color: routeColor,
                boxShadow: `0 0 24px ${routeColor}40`,
              }}
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {currentStep?.icon ?? '→'}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                In {formatDistance(Math.max(0, distanceRemaining))}
              </p>
              <motion.p
                key={`t-${stepIndex}`}
                className="text-white font-black text-xl md:text-2xl leading-tight"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {currentStep?.instruction ?? 'Follow route'}
              </motion.p>
              <p className="text-gray-400 text-sm mt-1">{currentStep?.detail}</p>
              {nextStep && (
                <p className="text-gray-600 text-xs mt-2 border-t border-white/5 pt-2">
                  Then · {nextStep.instruction} {nextStep.detail}
                </p>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { val: formatDuration(etaSeconds), lbl: 'ETA', accent: true },
              { val: formatDistance(distanceRemaining), lbl: 'Left' },
              { val: `${progressPct}%`, lbl: 'Done' },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-xl py-2 px-1 text-center border border-white/5 bg-white/[0.03]"
              >
                <p
                  className="text-sm font-bold tabular-nums"
                  style={{ color: item.accent ? routeColor : '#F8FAFC' }}
                >
                  {item.val}
                </p>
                <p className="text-[10px] text-gray-600">{item.lbl}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-300 touch-manipulation"
          >
            {expanded ? '▾ Hide turn-by-turn' : '▴ Show all directions'}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 space-y-1 max-h-[28vh] overflow-y-auto overscroll-contain"
              >
                {steps.map((s, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm ${
                      i === stepIndex ? 'bg-white/10 border border-white/10' : ''
                    }`}
                  >
                    <span className="w-8 text-center">{s.icon}</span>
                    <div className="min-w-0">
                      <p className={`font-semibold ${i === stepIndex ? 'text-white' : 'text-gray-400'}`}>
                        {s.instruction}
                      </p>
                      <p className="text-gray-600 text-xs truncate">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5 min-w-0">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
              style={{ background: routeColor }}
            />
            <span className="text-xs font-semibold truncate" style={{ color: routeColor }}>
              {isUnsafeRoute ? 'Unsafe route' : 'Safe route'} · {destination?.name}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
