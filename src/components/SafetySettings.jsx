import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getOrCreateTopic, saveTopic, generateTopic,
  loadContactName, saveContactName,
  getSubscribeUrl, sendTestAlert,
} from '../services/notificationService'

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
        copied
          ? 'bg-safe/20 text-safe border border-safe/30'
          : 'bg-card text-gray-400 border border-white/5 hover:text-white hover:border-white/15'
      }`}
    >
      {copied ? '✓ Copied' : label ?? 'Copy'}
    </button>
  )
}

export default function SafetySettings({ visible, onClose }) {
  const [topic, setTopic] = useState('')
  const [contactName, setContactName] = useState('')
  const [testState, setTestState] = useState('idle') // idle | sending | sent | failed
  const [testError, setTestError] = useState('')
  const [regenerateConfirm, setRegenerateConfirm] = useState(false)

  // Load from localStorage on open
  useEffect(() => {
    if (!visible) return
    setTopic(getOrCreateTopic())
    setContactName(loadContactName())
    setTestState('idle')
    setTestError('')
    setRegenerateConfirm(false)
  }, [visible])

  const handleSaveContact = () => {
    saveContactName(contactName)
  }

  const handleRegenerate = () => {
    if (!regenerateConfirm) { setRegenerateConfirm(true); return }
    const newTopic = generateTopic()
    saveTopic(newTopic)
    setTopic(newTopic)
    setRegenerateConfirm(false)
  }

  const handleTest = async () => {
    setTestState('sending')
    setTestError('')
    const result = await sendTestAlert(topic)
    if (result.ok) {
      setTestState('sent')
    } else {
      setTestState('failed')
      setTestError(result.error ?? 'Unknown error')
    }
  }

  const subscribeUrl = topic ? getSubscribeUrl(topic) : ''

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Panel */}
        <motion.div
          className="relative w-full max-w-md bg-surface border border-white/8 rounded-3xl overflow-hidden"
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-lg">
                  🔔
                </div>
                <div>
                  <h2 className="text-white font-black text-lg leading-none">Emergency Alerts</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Powered by ntfy.sh — no registration needed</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-card flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                ✕
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

            {/* How it works */}
            <div className="bg-primary/8 border border-primary/20 rounded-2xl p-4">
              <p className="text-primary text-xs font-semibold mb-1">How it works</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                When you activate emergency mode, HerWay instantly sends a push notification with your location to anyone subscribed to your private topic — no app, no account, just a browser link.
              </p>
            </div>

            {/* Trusted contact name */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Trusted Contact Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  onBlur={handleSaveContact}
                  placeholder="e.g. Emma, Mum, Sara..."
                  className="flex-1 bg-card border border-white/5 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-primary/40 transition-all"
                />
                <button
                  onClick={handleSaveContact}
                  className="px-3 py-2.5 bg-card border border-white/5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Your Private Topic ID
              </label>
              <div className="flex items-center gap-2 bg-card border border-white/5 rounded-xl px-4 py-2.5">
                <code className="text-primary text-xs flex-1 truncate font-mono">{topic}</code>
                <CopyButton value={topic} label="Copy" />
              </div>
              <p className="text-gray-600 text-xs mt-1.5">
                This is your unique private channel. Keep it confidential.
              </p>
            </div>

            {/* Subscribe link */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Share With Trusted Contact
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-card border border-white/5 rounded-xl px-4 py-2.5">
                  <span className="text-gray-400 text-xs flex-1 truncate">{subscribeUrl}</span>
                  <CopyButton value={subscribeUrl} label="Copy" />
                </div>
                <a
                  href={subscribeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-card border border-white/5 rounded-xl text-gray-400 hover:text-white text-xs font-semibold transition-colors"
                >
                  <span>↗</span>
                  <span>Open in browser (preview what they'll see)</span>
                </a>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                <p>Your contact can receive alerts by:</p>
                <div className="space-y-1 pl-2">
                  <p>• Opening the link above in any browser — notifications appear live</p>
                  <p>• Installing the <span className="text-gray-300">ntfy</span> app (iOS / Android) and subscribing to <span className="font-mono text-gray-300 text-[10px]">{topic}</span></p>
                </div>
              </div>
            </div>

            {/* Test button */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Test Your Setup
              </label>
              <button
                onClick={handleTest}
                disabled={testState === 'sending'}
                className={`w-full py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  testState === 'sent'
                    ? 'bg-safe/15 border border-safe/30 text-safe'
                    : testState === 'failed'
                    ? 'bg-danger/15 border border-danger/30 text-danger'
                    : 'bg-card border border-white/8 text-gray-300 hover:border-white/20 hover:text-white'
                }`}
              >
                {testState === 'sending' && (
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                )}
                {testState === 'idle' && '🔔 Send Test Notification'}
                {testState === 'sending' && 'Sending...'}
                {testState === 'sent' && '✓ Notification sent — check your topic link'}
                {testState === 'failed' && `✗ Failed — ${testError}`}
              </button>
            </div>

            {/* Regenerate */}
            <div className="pt-2 border-t border-white/5">
              <button
                onClick={handleRegenerate}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  regenerateConfirm
                    ? 'bg-danger/15 border border-danger/30 text-danger'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {regenerateConfirm
                  ? '⚠️ Confirm — this will invalidate your old subscribe link'
                  : 'Regenerate topic (invalidates current link)'}
              </button>
              {regenerateConfirm && (
                <button
                  onClick={() => setRegenerateConfirm(false)}
                  className="w-full text-xs text-gray-600 hover:text-gray-400 mt-1 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
