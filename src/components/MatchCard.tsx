'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Lock, ChevronRight, CheckCircle2 } from 'lucide-react'
import { format, differenceInSeconds, isPast } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold uppercase tracking-wider">
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
      className={`flex items-center gap-1.5 text-xs font-semibold ${urgent ? 'text-destructive' : 'text-muted-foreground'}`}
    >
      {urgent && <div className="w-1.5 h-1.5 rounded-full bg-destructive" />}
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
      <Card className="p-4 border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-display text-lg font-medium" style={{ color: homeTeam.primary }}>{match.team_home}</div>
            <span className="text-muted-foreground text-xs font-semibold">VS</span>
            <div className="font-display text-lg font-medium" style={{ color: awayTeam.primary }}>{match.team_away}</div>
          </div>
          <div className="text-right">
            <div className="font-body text-[11px] text-muted-foreground uppercase font-semibold">{format(matchTime, 'MMM d · h:mm a')}</div>
            {match.status === 'completed' && match.result_winner && (
              <div className="text-[10px] text-success font-bold mt-0.5">{match.result_winner} won</div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={`p-0 overflow-hidden relative bg-card ${match.status === 'live' ? 'border-amber-500/50' : 'border-border'}`}
    >
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="h-[2px] w-full"
        style={{
          background: match.status === 'live' ? '#F59E0B' : match.status === 'completed' ? '#10B981' : 'var(--border)',
        }}
      />

      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
            Match #{match.match_number}
          </span>
          {match.status === 'live' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-amber-500 bg-amber-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> LIVE
            </span>
          )}
          {match.status === 'completed' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-success bg-success/10">
              <CheckCircle2 size={10} /> DONE
            </span>
          )}
        </div>
        {match.status === 'upcoming' && <LockCountdown lockTime={match.lock_time} />}
        {match.status === 'completed' && match.result_winner && (
          <span className="font-body text-[11px] font-bold text-success">
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
            <div className="font-body text-[10px] text-muted-foreground uppercase tracking-wider text-center hidden sm:block">
              {match.team_home_full}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="font-display text-xl text-border font-medium">VS</div>
            <div className="flex items-center gap-1 font-body text-[11px] font-semibold text-muted-foreground">
              <Clock size={11} /> {format(matchTime, 'h:mm a')}
            </div>
            <div className="font-body text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{format(matchTime, 'MMM d')}</div>
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="font-display text-4xl font-medium tracking-tight" style={{ color: awayTeam.primary }}>
              {match.team_away}
            </div>
            <div className="font-body text-[10px] text-muted-foreground uppercase tracking-wider text-center hidden sm:block">
              {match.team_away_full}
            </div>
          </div>
        </div>

        {match.status === 'live' && (match.live_home_score || match.live_away_score) && (
          <div className="flex flex-col items-center gap-1 my-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-center justify-between w-full px-4 text-sm font-display font-medium">
              <span className="text-amber-500">{match.live_home_score || '0/0 (0)'}</span>
              <span className="text-amber-500">{match.live_away_score || '0/0 (0)'}</span>
            </div>
            {match.live_updated_at && (
              <span className="text-[9px] uppercase tracking-widest text-[#52525B] font-bold">
                Updated {format(new Date(match.live_updated_at), 'h:mm a')}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-6 py-2.5 rounded border border-border bg-accent/30 font-body text-[11px] text-muted-foreground font-semibold">
          <MapPin size={11} /> {match.venue || 'Venue TBD'}{match.city ? `, ${match.city}` : ''}
        </div>

        {match.status === 'completed' && match.result_winner && (
          <div className="mt-4 p-3 rounded border border-success/30 bg-success/10">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs font-semibold">
                <span className="text-success">{match.result_winner}</span>
                <span className="text-muted-foreground"> won</span>
              </span>
              {match.result_man_of_match && (
                <span className="font-body text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  MOM: {match.result_man_of_match}
                </span>
              )}
            </div>
          </div>
        )}

        {match.status === 'upcoming' && onPredict && (
          <Button
            size="lg"
            variant={locked ? "secondary" : hasPrediction ? "outline" : "default"}
            onClick={onPredict}
            disabled={locked}
            className={`w-full mt-5 font-semibold text-sm gap-2 ${
              hasPrediction && !locked ? 'bg-success/10 text-success border-success/30 hover:bg-success/20' : ''
            }`}
          >
            {locked ? (
              <><Lock size={14} /> Locked</>
            ) : hasPrediction ? (
              <><CheckCircle2 size={14} /> Edit Prediction <ChevronRight size={14} /></>
            ) : (
              <>Predict Now <ChevronRight size={14} /></>
            )}
          </Button>
        )}
      </div>
    </motion.div>
    </Card>
  )
}
