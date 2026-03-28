'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { differenceInSeconds, differenceInHours } from 'date-fns'
import { X, Clock } from 'lucide-react'
import type { Match } from '@/store/useGameStore'

interface MatchCountdownProps {
  match: Match
  onPredict: () => void
}

export default function MatchCountdown({ match, onPredict }: MatchCountdownProps) {
  const [secs, setSecs] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    function update() {
      const diff = differenceInSeconds(new Date(match.match_time), new Date())
      setSecs(Math.max(0, diff))
      const hoursUntil = differenceInHours(new Date(match.match_time), new Date())
      setShow(hoursUntil < 3 && hoursUntil >= 0)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [match])

  if (!show || dismissed || secs <= 0) return null

  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const timeStr = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`

  const lockDiff = differenceInSeconds(new Date(match.lock_time), new Date())
  const lockSoon = lockDiff < 1800 && lockDiff > 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        className="w-full relative z-30 mb-4 cursor-pointer"
        onClick={onPredict}
      >
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-colors
          ${lockSoon ? 'bg-[#EF4444]/10 border-[#EF4444]/30' : 'bg-white text-black border-white'}`}>
          <div className="flex items-center gap-3">
            <motion.div
              animate={lockSoon ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <Clock size={18} className={lockSoon ? "text-[#EF4444]" : "text-black"} />
            </motion.div>
            <div className="flex flex-col">
              <span className={`font-display text-base font-semibold ${lockSoon ? "text-[#EF4444]" : "text-black"}`}>
                {match.team_home} vs {match.team_away}
              </span>
              <span className={`font-body text-[10px] uppercase font-semibold ${lockSoon ? "text-[#EF4444]/80" : "text-gray-600"}`}>
                {lockSoon ? 'Prediction locks soon!' : `Predict before it locks`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`font-display text-2xl font-medium tabular-nums ${lockSoon ? "text-[#EF4444]" : "text-black"}`}>
              {timeStr}
            </span>
            <button
               onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
               className={`p-1.5 rounded-full transition-colors ${lockSoon ? "hover:bg-[#EF4444]/20 text-[#EF4444]" : "hover:bg-gray-200 text-gray-500"}`}
            >
               <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
