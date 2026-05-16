import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FakeCallScreen from './FakeCallScreen'

// Build checklist items from props
const buildChecklist = ({ contactName, alertStatus, safeSpace }) => [
  {
    label: alertStatus === 'sending'
      ? `Alerting ${contactName}...`
      : alertStatus === 'sent'
      ? `${contactName} has been notified`
      : alertStatus === 'failed'
      ? `Notification failed — try sending again`
      : `Alert sent to ${contactName}`,
    status: alertStatus, // 'sending' | 'sent' | 'failed'
  },
  { label: 'Journey recording started', status: 'sent' },
  {
    label: safeSpace
      ? `Nearest safe space: ${safeSpace.name} (${safeSpace.distance})`
      : 'Safe spaces located nearby',
    status: 'sent',
  },
  { label: 'Emergency services on standby', status: 'sent' },
]

function ChecklistIcon({ status }) {
  if (status === 'sending') {
    return (
      <div className="w-5 h-5 rounded-full bg-warning/20 border border-warning/40 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="w-2.5 h-2.5 border-2 border-warning/40 border-t-warning rounded-full animate-spin block" />
      </div>
    )
  }
  if (status === 'failed') {
    return (
      <div className="w-5 h-5 rounded-full bg-danger/20 border border-danger/40 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-danger text-[10px] font-black leading-none">✕</span>
      </div>
    )
  }
  return (
    <div className="w-5 h-5 rounded-full bg-safe/20 border border-safe/40 flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg className="w-3 h-3 text-safe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

export default function EmergencyOverlay({
  visible,
  nearestSafeSpace,
  alertStatus,      // 'idle' | 'sending' | 'sent' | 'failed'
  contactName,
  onClose,
  onNavigateToSafeSpace,
  onResendAlert,
}) {
  const [fakeCall, setFakeCall] = useState(false)
  const [checklistVisible, setChecklistVisible] = useState([])

  useEffect(() => {
    if (!visible) {
      setFakeCall(false)
      setChecklistVisible([])
      return
    }
    // Stagger checklist items in after a brief delay
    ;[0, 1, 2, 3].forEach(i => {
      setTimeout(() => setChecklistVisible(prev => [...prev, i]), 350 + i * 260)
    })
  }, [visible])

  const checklist = buildChecklist({
    contactName: contactName || 'Trusted Contact',
    alertStatus: alertStatus ?? 'sent',
    safeSpace: nearestSafeSpace,
  })

  if (fakeCall) {
    return <FakeCallScreen contactName={contactName} onEnd={() => setFakeCall(false)} />
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ background: 'rgba(8,12,20,0.97)' }}
        >
          <motion.div
            className="w-full max-w-sm flex flex-col items-center text-center"
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 260, damping: 22 }}
          >
            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2 bg-primary/15 border border-primary/40 rounded-full px-5 py-2.5 mb-8"
            >
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-primary font-bold text-sm tracking-wide">Safe Mode Active</span>
            </motion.div>

            {/* Pulsing shield */}
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute w-28 h-28 rounded-full border-2 border-primary/20 animate-ping" />
              <div className="absolute w-20 h-20 rounded-full border border-primary/30 animate-pulse-slow" />
              <div className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary/50 flex items-center justify-center text-4xl">
                🛡️
              </div>
            </div>

            <h1 className="text-white font-black text-3xl mb-3">You are protected</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xs">
              {alertStatus === 'sent'
                ? `${contactName || 'Your trusted contact'} has received your location.`
                : alertStatus === 'failed'
                ? 'Alert could not be sent. Tap below to try again.'
                : 'Sending your location to your trusted contact...'}
            </p>

            {/* Checklist */}
            <div className="w-full bg-surface border border-white/5 rounded-2xl p-5 mb-6 text-left space-y-3.5">
              {checklist.map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -14 }}
                  animate={checklistVisible.includes(i) ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.28 }}
                >
                  <ChecklistIcon status={item.status} />
                  <span
                    className="text-sm leading-relaxed"
                    style={{
                      color: item.status === 'failed' ? '#F87171'
                           : item.status === 'sending' ? '#FBBF24'
                           : '#D1D5DB',
                    }}
                  >
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Resend if failed */}
            {alertStatus === 'failed' && (
              <button
                onClick={onResendAlert}
                className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-danger/10 border border-danger/30 text-danger text-sm font-bold hover:bg-danger/20 transition-colors"
              >
                ↺ Retry Alert
              </button>
            )}

            {/* Action buttons */}
            <div className="w-full space-y-3 mb-6">
              <button
                onClick={() => setFakeCall(true)}
                className="w-full flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl px-5 py-4 hover:bg-primary/20 transition-colors text-left"
              >
                <span className="text-2xl">📞</span>
                <div>
                  <div className="text-primary font-bold text-sm">Trigger Fake Call</div>
                  <div className="text-gray-500 text-xs">Incoming call from {contactName || 'Trusted Contact'}</div>
                </div>
              </button>

              {nearestSafeSpace && (
                <button
                  onClick={() => { onNavigateToSafeSpace?.(nearestSafeSpace); onClose() }}
                  className="w-full flex items-center gap-3 bg-safe/10 border border-safe/30 rounded-2xl px-5 py-4 hover:bg-safe/20 transition-colors text-left"
                >
                  <span className="text-2xl">🏠</span>
                  <div>
                    <div className="text-safe font-bold text-sm">Navigate to Safety</div>
                    <div className="text-gray-500 text-xs">{nearestSafeSpace.name} · {nearestSafeSpace.distance}</div>
                  </div>
                </button>
              )}
            </div>

            {/* Deactivate */}
            <button
              onClick={onClose}
              className="text-gray-600 text-sm font-medium hover:text-gray-400 transition-colors underline underline-offset-4"
            >
              I'm safe — deactivate
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
