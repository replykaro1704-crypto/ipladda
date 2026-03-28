'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCodeSVG from 'react-qr-code'
import { X, Copy, Check, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
        <Card
          className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl border-border shadow-2xl overflow-hidden"
        >
          <CardHeader className="p-5 sm:p-6 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2 text-foreground">
              <Users size={18} />
              <CardTitle className="font-display text-xl tracking-tight">Invite Friends</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={20} />
            </Button>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 flex flex-col items-center">
            <div className="w-full max-w-[200px] mb-6 p-4 bg-white rounded-2xl flex items-center justify-center">
              <QRCodeSVG value={joinUrl} size={160} level="M" />
            </div>

            <div className="w-full bg-accent/30 text-center !p-4 mb-6 border border-border rounded-xl">
              <p className="text-muted-foreground text-xs mb-1 font-body uppercase font-semibold tracking-wider">Access Code</p>
              <button
                onClick={copyCode}
                className="font-display text-4xl font-medium tracking-[0.3em] text-foreground hover:text-muted-foreground transition-colors"
              >
                {roomCode}
              </button>
              <p className="text-muted-foreground text-[10px] mt-1 font-body uppercase font-bold tracking-widest">Tap to copy</p>
            </div>

            <div className="w-full space-y-3">
              <Button onClick={shareWhatsApp} className="w-full py-6 rounded-xl font-semibold gap-2 border-none" style={{ background: '#25D366', color: '#fff' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </Button>
              <Button variant="outline" onClick={copyLink} className="w-full py-6 rounded-xl text-muted-foreground gap-2">
                {copied ? <><Check size={16} className="text-success" /> Copied to Clipboard</> : <><Copy size={16} /> Copy Join Link</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
