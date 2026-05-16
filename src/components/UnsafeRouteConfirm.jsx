import { motion, AnimatePresence } from 'framer-motion'

export default function UnsafeRouteConfirm({ visible, alertCount, onConfirm, onCancel }) {
  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-4 sm:p-6"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        <motion.div
          className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-danger/40 overflow-hidden max-h-[90dvh] overflow-y-auto"
          style={{ background: 'linear-gradient(165deg, #1a0a0a 0%, #111827 50%, #0a1628 100%)' }}
          initial={{ scale: 0.9, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        >
          <motion.div
            className="h-1 w-full bg-danger"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />

          <motion.div
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-danger/20 blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <motion.div
            className="flex flex-col items-center px-8 pt-10 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.div
              className="w-16 h-16 rounded-2xl bg-danger/20 border-2 border-danger flex items-center justify-center text-3xl mb-5"
              animate={{ boxShadow: ['0 0 0 0 rgba(239,68,68,0.5)', '0 0 0 16px rgba(239,68,68,0)', '0 0 0 0 rgba(239,68,68,0)'] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              ⚠️
            </motion.div>

            <h2 className="text-white font-black text-xl text-center mb-2">
              Safety alerts on this route
            </h2>
            <p className="text-gray-400 text-sm text-center leading-relaxed mb-1">
              This route currently contains active safety alerts.
              {alertCount > 0 && (
                <span className="text-danger font-semibold"> {alertCount} alert{alertCount !== 1 ? 's' : ''} detected nearby.</span>
              )}
            </p>
            <p className="text-gray-500 text-sm text-center mb-8">
              Continue anyway?
            </p>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={onCancel}
                className="w-full py-4 rounded-2xl font-bold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
                }}
              >
                Use safest route instead
              </button>
              <button
                onClick={onConfirm}
                className="w-full py-3.5 rounded-2xl border border-danger/50 text-danger font-semibold hover:bg-danger/10 transition-colors warning-blink"
              >
                Continue with unsafe route
              </button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
