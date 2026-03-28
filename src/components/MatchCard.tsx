'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Lock, ChevronRight, CheckCircle2 } from 'lucide-react'
import { format, differenceInSeconds, isPast } from 'date-fns'
import { getTeamColors } from '@/lib/teams'
import type { Match } from '@/store/useGameStore'

interface MatchCardProps {
  match: Match
  onPredict?: () => void
  hasPrediction?: boolean
  compact?: boolean
}

function LockCountdown({ lockTime }: { lockTime: string }) {
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    function calc() {
      const diff = differenceInSeconds(new Date(lockTime), new Date())
      setSecs(Math.max(0, diff))
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [lockTime])

  if (secs <= 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[10px] font-bold uppercase tracking-wider">
        <Lock size={10} /> Locked
      </div>
    )
  }

  const urgent = secs < 600
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60

  return (
    <motion.div
      animate={urgent ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
      className={`flex items-center gap-1.5 text-xs font-semibold ${urgent ? 'text-[#EF4444]' : 'text-[#A1A1AA]'}`}
    >
      {urgent && <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />}
      <Lock size={10} />
      {h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`}
    </motion.div>
  )
}

export default function MatchCard({ match, onPredict, hasPrediction, compact }: MatchCardProps) {
  const locked = isPast(new Date(match.lock_time))
  const matchTime = new Date(match.match_time)
  const homeTeam = getTeamColors(match.team_home)
  const awayTeam = getTeamColors(match.team_away)

  if (compact) {
    return (
      <div className="clean-card !p-4 border-[#222]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-display text-lg font-medium" style={{ color: homeTeam.primary }}>{match.team_home}</div>
            <span className="text-[#52525B] text-xs font-semibold">VS</span>
            <div className="font-display text-lg font-medium" style={{ color: awayTeam.primary }}>{match.team_away}</div>
          </div>
          <div className="text-right">
            <div className="font-body text-[11px] text-[#A1A1AA] uppercase font-semibold">{format(matchTime, 'MMM d · h:mm a')}</div>
            {match.status === 'completed' && match.result_winner && (
              <div className="text-[10px] text-[#10B981] font-bold mt-0.5">{match.result_winner} won</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`clean-card !p-0 overflow-hidden relative ${match.status === 'live' ? 'border-[#F59E0B]/30' : 'border-[#222]'}`}
    >
      <div className="h-[2px] w-full"
        style={{
          background: match.status === 'live' ? '#F59E0B' : match.status === 'completed' ? '#10B981' : '#333',
        }}
      />

      <div className="flex items-center justify-between px-5 py-3 border-b border-[#222] bg-[#0A0A0A]">
        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">
            Match #{match.match_number}
          </span>
          {match.status === 'live' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" /> LIVE
            </span>
          )}
          {match.status === 'completed' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-[#10B981] bg-[#10B981]/10">
              <CheckCircle2 size={10} /> DONE
            </span>
          )}
        </div>
        {match.status === 'upcoming' && <LockCountdown lockTime={match.lock_time} />}
        {match.status === 'completed' && match.result_winner && (
          <span className="font-body text-[11px] font-bold text-[#10B981]">
            {match.result_winner} won
          </span>
        )}
      </div>

      <div className="px-5 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="font-display text-4xl font-medium tracking-tight" style={{ color: homeTeam.primary }}>
              {match.team_home}
            </div>
            <div className="font-body text-[10px] text-[#A1A1AA] uppercase tracking-wider text-center hidden sm:block">
              {match.team_home_full}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="font-display text-xl text-[#333] font-medium">VS</div>
            <div className="flex items-center gap-1 font-body text-[11px] font-semibold text-[#A1A1AA]">
              <Clock size={11} /> {format(matchTime, 'h:mm a')}
            </div>
            <div className="font-body text-[10px] text-[#52525B] uppercase tracking-widest font-semibold">{format(matchTime, 'MMM d')}</div>
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="font-display text-4xl font-medium tracking-tight" style={{ color: awayTeam.primary }}>
              {match.team_away}
            </div>
            <div className="font-body text-[10px] text-[#A1A1AA] uppercase tracking-wider text-center hidden sm:block">
              {match.team_away_full}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 py-2.5 rounded border border-[#222] bg-[#111] font-body text-[11px] text-[#A1A1AA] font-semibold">
          <MapPin size={11} /> {match.venue}, {match.city}
        </div>

        {match.status === 'completed' && match.result_winner && (
          <div className="mt-4 p-3 rounded border border-[#10B981]/20 bg-[#10B981]/5">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs font-semibold">
                <span className="text-[#10B981]">{match.result_winner}</span>
                <span className="text-[#A1A1AA]"> won</span>
              </span>
              {match.result_man_of_match && (
                <span className="font-body text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold">
                  MOM: {match.result_man_of_match}
                </span>
              )}
            </div>
          </div>
        )}

        {match.status === 'upcoming' && onPredict && (
          <button
            onClick={onPredict}
            disabled={locked}
            className={`w-full mt-5 py-3.5 flex items-center justify-center gap-2 rounded-lg font-body text-sm font-semibold transition-all ${
              locked
                ? 'bg-[#1A1A1A] text-[#52525B] border border-[#333] cursor-not-allowed'
                : hasPrediction
                ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/20'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {locked ? (
              <><Lock size={14} /> Locked</>
            ) : hasPrediction ? (
              <><CheckCircle2 size={14} /> Edit Prediction <ChevronRight size={14} /></>
            ) : (
              <>Predict Now <ChevronRight size={14} /></>
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}
