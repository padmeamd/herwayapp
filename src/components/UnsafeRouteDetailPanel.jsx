import { motion, AnimatePresence } from 'framer-motion'
import { formatDuration, formatDistance } from '../services/routingService'

export default function UnsafeRouteDetailPanel({
  visible,
  route,
  safety,
  onClose,
  onUseSafeRoute,
  onStartJourney,
}) {
  const reasons = safety?.unsafeReasons ?? []

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            className="fixed inset-0 z-[45] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed z-[40] flex flex-col overflow-hidden border border-danger/30 shadow-2xl
              inset-x-0 bottom-0 rounded-t-3xl max-h-[min(72dvh,560px)] unsafe-detail-panel
              md:inset-auto md:left-auto md:right-6 md:top-24 md:bottom-auto md:w-[400px] md:max-h-[calc(100dvh-7rem)] md:rounded-3xl"
            style={{ background: 'linear-gradient(180deg, #1a0a0c 0%, #111827 45%, #0a1628 100%)' }}
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <motion.div
              className="h-1 bg-danger flex-shrink-0"
              animate={{ opacity: [1, 0.35, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            />

            <motion.div
              className="md:hidden flex justify-center py-2.5 flex-shrink-0 cursor-pointer"
              onClick={onClose}
            >
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </motion.div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5 md:px-6 md:pb-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <motion.div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 border-danger flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)' }}
                    animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0.5)', '0 0 0 12px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    ⚠
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-danger text-[10px] font-black uppercase tracking-widest warning-blink">
                      Unsafe route
                    </p>
                    <h2 className="text-white font-black text-lg leading-tight">Why this path is risky</h2>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">
                      {safety?.statusLabel ?? 'Active alerts detected'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white flex-shrink-0 touch-manipulation"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {route && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl bg-danger/10 border border-danger/25 px-3 py-2.5 text-center">
                    <p className="text-danger font-bold text-sm">{formatDuration(route.duration)}</p>
                    <p className="text-gray-600 text-[10px]">Est. walk</p>
                  </div>
                  <div className="rounded-xl bg-danger/10 border border-danger/25 px-3 py-2.5 text-center">
                    <p className="text-danger font-bold text-sm">{formatDistance(route.distance)}</p>
                    <p className="text-gray-600 text-[10px]">Distance</p>
                  </div>
                </div>
              )}

              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                HerWay detected the following safety concerns along this direct route. The green route avoids these zones.
              </p>

              <ul className="space-y-2.5 mb-5">
                {reasons.map((r, i) => (
                  <motion.li
                    key={`${r.title}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3 p-3.5 rounded-2xl border border-danger/25 bg-danger/5"
                  >
                    <span className="text-xl flex-shrink-0">{r.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm leading-snug">{r.title}</p>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">{r.detail}</p>
                      {r.time && (
                        <p className="text-danger/80 text-[10px] mt-1.5 font-medium">{r.time} · community report</p>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ul>

              {safety?.explanation && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 mb-5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">HerWay summary</p>
                  <p className="text-gray-300 text-xs leading-relaxed">{safety.explanation}</p>
                </div>
              )}
            </div>

            <div
              className="flex-shrink-0 px-5 pt-2 pb-5 md:px-6 md:pb-6 border-t border-white/5 flex flex-col gap-2.5"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
            >
              <button
                type="button"
                onClick={onUseSafeRoute}
                className="w-full min-h-[48px] py-3.5 rounded-2xl font-bold text-white touch-manipulation"
                style={{
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
                }}
              >
                Switch to safe green route
              </button>
              {onStartJourney && (
                <button
                  type="button"
                  onClick={onStartJourney}
                  className="w-full min-h-[48px] py-3.5 rounded-2xl font-bold text-white touch-manipulation border border-danger/50"
                  style={{
                    background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                    boxShadow: '0 8px 24px rgba(239,68,68,0.35)',
                  }}
                >
                  Start Journey anyway
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] py-3 rounded-2xl border border-white/10 text-gray-400 font-semibold touch-manipulation"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
