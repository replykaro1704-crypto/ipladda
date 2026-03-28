'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ArrowRight, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface JoinOverlayProps {
  roomName: string
  playerCount: number
  onJoin: (name: string) => Promise<void>
}

export default function JoinOverlay({ roomName, playerCount, onJoin }: JoinOverlayProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 500)
    return () => clearTimeout(t)
  }, [])

  async function handleJoin() {
    const trimmed = name.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    try {
      await onJoin(trimmed)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-card sm:rounded-2xl rounded-t-2xl sm:border border-border shadow-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8 flex flex-col items-center">
          
          <div className="w-16 h-16 rounded-full bg-accent/50 border border-border flex items-center justify-center text-muted-foreground mb-6">
             <Users size={28} />
          </div>

          <h2 className="font-display text-2xl font-medium tracking-tight mb-2 text-center text-foreground">{roomName}</h2>
          
          <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/30 border border-border rounded-full font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {playerCount} {playerCount === 1 ? 'player' : 'players'} waiting
          </div>

          <div className="w-full mb-6">
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                className="w-full pl-12 pr-4 py-7 rounded-xl font-body transition-all text-lg"
                placeholder="Enter your name"
                value={name}
                maxLength={20}
                onChange={(e) => { setName(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && !loading && name.trim() && handleJoin()}
                disabled={loading}
              />
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="text-xs font-semibold text-destructive mt-2 ml-1"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <Button
            size="lg"
            onClick={handleJoin}
            disabled={!name.trim() || loading}
            className="w-full py-6 rounded-xl font-semibold text-lg gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Join Room <ArrowRight size={16} />
              </>
            )}
          </Button>

          <p className="text-center font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-6">
            No signup required
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
