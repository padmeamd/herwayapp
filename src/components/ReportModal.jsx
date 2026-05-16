import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { INCIDENT_TYPES } from '../data/mockData'

export default function ReportModal({ visible, onClose, onSubmit, reportLocation }) {
  const [selected, setSelected] = useState(null)
  const [description, setDescription] = useState('')
  const [notifyNearby, setNotifyNearby] = useState(true)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    setLoading(false)
    setDone(true)
    const type = INCIDENT_TYPES.find(t => t.id === selected)
    onSubmit?.({
      ...type,
      id: `user-${Date.now()}`,
      time: 'Just now',
      reportCount: 1,
      description: description.trim() || type.label,
      notifyNearby,
      reportLocation,
    })
    setTimeout(() => {
      setSelected(null)
      setDescription('')
      setNotifyNearby(true)
      setDone(false)
      onClose()
    }, 2000)
  }

  const handleClose = () => {
    setSelected(null)
    setDescription('')
    setNotifyNearby(true)
    setDone(false)
    onClose()
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          transition={{ duration: 0.3 }}
          onClick={handleClose}
        />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-lg bg-surface rounded-t-3xl border border-white/10 border-b-0 p-6 pb-10"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-6" />

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-6 gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-safe/20 border border-safe/40 flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h3 className="text-white font-bold text-xl">Report Submitted</h3>
                <p className="text-gray-500 text-sm text-center">
                  Thank you for keeping the community safe.
                </p>
                {notifyNearby && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-primary/15 border border-primary/30 w-full"
                  >
                    <span className="text-primary text-lg">🔔</span>
                    <div>
                      <p className="text-white font-semibold text-sm">2 nearby users notified</p>
                      <p className="text-gray-500 text-xs">Anonymous alert sent to women in this area</p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-white font-black text-xl mb-1">Report an Incident</h2>
                <p className="text-gray-500 text-sm mb-1">
                  Help keep your community safe — reports are anonymous.
                </p>
                {reportLocation && (
                  <p className="text-primary text-xs font-semibold mb-4 flex items-center gap-1.5">
                    <span>📍</span> Reporting at selected map location
                  </p>
                )}

                {/* Incident type grid */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {INCIDENT_TYPES.map((item) => {
                    const isSelected = selected === item.id
                    const severityColor =
                      item.severity === 'high' ? '#F87171' :
                      item.severity === 'medium' ? '#FBBF24' : '#60A5FA'
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelected(item.id)}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all duration-150 ${
                          isSelected ? 'scale-[1.02]' : 'hover:bg-card'
                        }`}
                        style={{
                          borderColor: isSelected ? severityColor + '88' : 'rgba(255,255,255,0.06)',
                          backgroundColor: isSelected ? severityColor + '18' : '#1C2436',
                        }}
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span
                          className="text-xs font-semibold text-center leading-tight"
                          style={{ color: isSelected ? severityColor : '#9CA3AF' }}
                        >
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Description field */}
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add details to help others (optional)..."
                  className="w-full bg-card border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 resize-none mb-3 focus:outline-none focus:border-primary/40 transition-colors"
                  rows={2}
                />

                {/* Notify nearby toggle */}
                <button
                  onClick={() => setNotifyNearby(v => !v)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 transition-all duration-200 ${
                    notifyNearby
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-white/8 bg-card hover:border-white/15'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      notifyNearby ? 'bg-primary border-primary' : 'border-gray-600'
                    }`}
                  >
                    {notifyNearby && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="text-left flex-1">
                    <p className={`text-sm font-semibold ${notifyNearby ? 'text-white' : 'text-gray-400'}`}>
                      Notify nearby HerWay users
                    </p>
                    <p className="text-xs text-gray-600">Anonymous alert to women in this area</p>
                  </div>
                  {notifyNearby && (
                    <span className="flex items-center gap-1 text-[10px] text-primary font-bold flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      LIVE
                    </span>
                  )}
                </button>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3.5 rounded-2xl bg-card text-gray-400 font-semibold hover:bg-card-alt transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selected || loading}
                    className="py-3.5 rounded-2xl font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      flex: 2,
                      background: selected ? 'linear-gradient(135deg, #F472B6, #A78BFA)' : '#1C2436',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </span>
                    ) : 'Submit Report'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
