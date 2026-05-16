import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { loadContactName } from '../services/notificationService'

export default function FakeCallScreen({ contactName, onEnd }) {
  const name = contactName || loadContactName() || 'Trusted Contact'
  const [answered, setAnswered] = useState(false)
  const [callTime, setCallTime] = useState(0)

  useEffect(() => {
    if (!answered) return
    const interval = setInterval(() => setCallTime(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [answered])

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-between py-16 px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #080C14 100%)' }}
    >
      {/* Top info */}
      <div className="flex flex-col items-center gap-2 mt-8">
        <p className="text-gray-400 text-sm">
          {answered ? `Connected · ${formatTime(callTime)}` : 'Incoming call...'}
        </p>
        <h2 className="text-white font-black text-3xl">{name}</h2>
        <p className="text-primary text-sm font-medium">{'Trusted Contact'}</p>
      </div>

      {/* Avatar with pulse */}
      <div className="relative flex items-center justify-center">
        {!answered && (
          <>
            <div className="absolute w-44 h-44 rounded-full border-2 border-primary/15 animate-ping" />
            <div className="absolute w-36 h-36 rounded-full border border-primary/25 animate-pulse" />
          </>
        )}
        {answered && (
          <div className="absolute w-36 h-36 rounded-full border-2 border-safe/40 animate-pulse-slow" />
        )}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center text-6xl border-4"
          style={{
            backgroundColor: answered ? 'rgba(52,211,153,0.1)' : 'rgba(167,139,250,0.1)',
            borderColor: answered ? 'rgba(52,211,153,0.5)' : 'rgba(167,139,250,0.5)',
          }}
        >
          {'👤'}
        </div>
      </div>

      {/* Status */}
      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1"
        >
          <p className="text-safe font-semibold text-sm">Location shared successfully</p>
          <p className="text-gray-500 text-xs">Stay safe. Help is on the way.</p>
        </motion.div>
      )}

      {/* Call buttons */}
      <div className="flex items-center gap-12">
        {/* Decline / End */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onEnd}
            className="w-16 h-16 rounded-full bg-danger/90 hover:bg-danger flex items-center justify-center text-white text-2xl transition-all active:scale-95 shadow-lg shadow-danger/30"
          >
            📵
          </button>
          <span className="text-gray-500 text-xs">{answered ? 'End' : 'Decline'}</span>
        </div>

        {/* Accept (only before answering) */}
        {!answered && (
          <div className="flex flex-col items-center gap-2">
            <motion.button
              onClick={() => setAnswered(true)}
              className="w-16 h-16 rounded-full bg-safe/90 hover:bg-safe flex items-center justify-center text-white text-2xl transition-all active:scale-95 shadow-lg shadow-safe/30"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            >
              📞
            </motion.button>
            <span className="text-gray-500 text-xs">Answer</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
