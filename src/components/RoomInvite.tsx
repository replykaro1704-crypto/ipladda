'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCodeSVG from 'react-qr-code'
import { X, Copy, Check, Users } from 'lucide-react'

interface RoomInviteProps {
  roomCode: string
  roomName: string
  onClose: () => void
}

export default function RoomInvite({ roomCode, roomName, onClose }: RoomInviteProps) {
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ipl-adda.vercel.app'
  const joinUrl = `${appUrl}/r/${roomCode}`

  function copyCode() {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareWhatsApp() {
    const msg = `IPL 2026 prediction game mein join kar! 🏏\nRoom: ${roomName}\nCode: ${roomCode}\nLink: ${joinUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm bg-[#0A0A0A] sm:rounded-2xl rounded-t-2xl sm:border border-[#222] flex flex-col shadow-2xl overflow-hidden"
        >
          <div className="p-5 sm:p-6 border-b border-[#222] flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Users size={18} />
              <h3 className="font-display text-xl font-medium tracking-tight">Invite Friends</h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 sm:p-6 flex flex-col items-center">
            <div className="w-full max-w-[200px] mb-6 p-4 bg-white rounded-2xl flex items-center justify-center">
              <QRCodeSVG value={joinUrl} size={160} level="M" />
            </div>

            <div className="w-full clean-card text-center !p-4 mb-6 border-[#222]">
              <p className="text-[#A1A1AA] text-xs mb-1 font-body uppercase font-semibold tracking-wider">Access Code</p>
              <button
                onClick={copyCode}
                className="font-display text-4xl font-medium tracking-[0.3em] text-white hover:text-gray-300 transition-colors"
              >
                {roomCode}
              </button>
              <p className="text-[#52525B] text-[10px] mt-1 font-body uppercase font-bold tracking-widest">Tap to copy</p>
            </div>

            <div className="w-full space-y-3">
              <button onClick={shareWhatsApp} className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-white transition-opacity hover:opacity-90" style={{ background: '#25D366' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share on WhatsApp
            </button>
            <button onClick={copyLink} className="clean-btn-ghost w-full">
              {copied ? <><Check size={16} className="text-[#10B981]" /> Copied to Clipboard</> : <><Copy size={16} /> Copy Join Link</>}
            </button>
          </div>
        </div>
      </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
