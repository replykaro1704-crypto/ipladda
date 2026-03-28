'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { isPast, differenceInSeconds, format } from 'date-fns'
import { Lock, X, Search, Check, Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getTeamColors } from '@/lib/teams'
import { RUNS_BRACKETS } from '@/lib/teams'
import type { Match, Prediction } from '@/store/useGameStore'

interface PredictionFormProps {
  match: Match
  playerId: string
  roomId: string
  existingPrediction?: Prediction
  onClose: () => void
  onSubmitted: (pred: Prediction) => void
}

function LockTimer({ lockTime, onLocked }: { lockTime: string; onLocked: () => void }) {
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    function calc() {
      const diff = differenceInSeconds(new Date(lockTime), new Date())
      const val = Math.max(0, diff)
      setSecs(val)
      if (val === 0) onLocked()
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [lockTime, onLocked])

  const urgent = secs < 600
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60

  return (
    <motion.div
      animate={urgent ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
      className={`text-center p-3 rounded-xl border ${urgent ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-accent border-border'}`}
    >
      <div className="flex items-center justify-center gap-2 font-display text-sm font-semibold tracking-wider">
        {urgent && <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />}
        <Lock size={12} className={urgent ? 'text-destructive' : 'text-muted-foreground'} />
        <span className={urgent ? 'text-destructive' : 'text-muted-foreground'}>
          {secs <= 0 ? 'Locked!' :
            h > 0 ? `Locks in ${h}h ${m}m` :
            m > 0 ? `Locks in ${m}m ${s}s` :
            `ONLY ${s}s LEFT!`}
        </span>
      </div>
    </motion.div>
  )
}

function PlayerSearchInput({
  value, onChange, options
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative z-10">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          className="!pl-9 h-12 rounded-xl text-base bg-accent text-foreground border-border"
          placeholder={options.length === 0 ? 'XI not announced yet' : 'Search player...'}
          value={query}
          disabled={options.length === 0}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </div>
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl z-20 max-h-48 overflow-y-auto shadow-2xl">
            {filtered.map((p) => (
              <button
                key={p}
                className="w-full text-left px-4 py-3 text-sm hover:bg-accent transition-colors font-body text-muted-foreground hover:text-foreground"
                onMouseDown={() => { onChange(p); setQuery(p); setOpen(false) }}
              >
                {p}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PredictionForm({
  match, playerId, roomId, existingPrediction, onClose, onSubmitted
}: PredictionFormProps) {
  const [winner, setWinner] = useState(existingPrediction?.predicted_winner ?? '')
  const [runsBracket, setRunsBracket] = useState(existingPrediction?.predicted_runs_bracket ?? '')
  const [topScorer, setTopScorer] = useState(existingPrediction?.predicted_top_scorer ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [locked, setLocked] = useState(() => isPast(new Date(match.lock_time)))

  const homeTeam = getTeamColors(match.team_home)
  const awayTeam = getTeamColors(match.team_away)

  const allPlayers = [
    ...(match.home_playing_xi ?? []),
    ...(match.away_playing_xi ?? []),
  ]

  const pointsPreview = (winner ? 10 : 0) + (runsBracket ? 12 : 0) + (topScorer ? 15 : 0)

  async function handleSubmit() {
    if (!winner) { setError('Select a winning team first.'); return }
    if (locked) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/predictions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, matchId: match.id, roomId, predictedWinner: winner, predictedRunsBracket: runsBracket || undefined, predictedTopScorer: topScorer || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      setSuccess(true)
      setTimeout(() => { onSubmitted(data.prediction); onClose() }, 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-xl bg-card sm:rounded-2xl rounded-t-2xl sm:border border-border max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        <div className="p-5 sm:p-6 border-b border-border bg-card sticky top-0 z-10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight">Make Prediction</h2>
             <p className="text-muted-foreground text-xs font-body font-semibold uppercase tracking-wider mt-1">Match #{match.match_number} • {format(new Date(match.match_time), 'MMM d')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-muted-foreground hover:text-foreground">
            <X size={20} />
          </Button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {!locked && <LockTimer lockTime={match.lock_time} onLocked={() => setLocked(true)} />}

          {locked && (
            <div className="px-4 py-3 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-center justify-center gap-2 font-semibold text-sm mb-6">
              <Lock size={14} /> Predictions are locked
            </div>
          )}

          <div className={`space-y-8 mt-6 ${locked ? 'opacity-60 pointer-events-none' : ''}`}>
            
            {/* Winner Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground font-body">Match Winner</label>
                <div className="text-[10px] font-bold bg-primary/20 text-primary-foreground px-2 py-0.5 rounded">+10 PTS</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWinner(match.team_home)}
                  className={`relative overflow-hidden p-6 rounded-xl border flex flex-col items-center justify-center transition-all
                    ${winner === match.team_home ? 'bg-primary border-primary shadow-xl' : 'bg-accent border-border hover:border-muted-foreground'}`}
                >
                  <span className={`font-display text-2xl font-medium tracking-tight mb-1 relative z-10 ${winner === match.team_home ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {match.team_home}
                  </span>
                  <span className={`font-body text-[10px] font-semibold uppercase tracking-wider relative z-10 ${winner === match.team_home ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {match.team_home_full}
                  </span>
                  {winner === match.team_home && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-3 text-primary-foreground">
                      <Check size={16} />
                    </motion.div>
                  )}
                </button>

                <button
                  onClick={() => setWinner(match.team_away)}
                  className={`relative overflow-hidden p-6 rounded-xl border flex flex-col items-center justify-center transition-all
                    ${winner === match.team_away ? 'bg-primary border-primary shadow-xl' : 'bg-accent border-border hover:border-muted-foreground'}`}
                >
                  <span className={`font-display text-2xl font-medium tracking-tight mb-1 relative z-10 ${winner === match.team_away ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {match.team_away}
                  </span>
                  <span className={`font-body text-[10px] font-semibold uppercase tracking-wider relative z-10 ${winner === match.team_away ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {match.team_away_full}
                  </span>
                  {winner === match.team_away && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-3 top-3 text-primary-foreground">
                      <Check size={16} />
                    </motion.div>
                  )}
                </button>
              </div>
            </div>

            <div className="h-px bg-border -mx-5 sm:-mx-6" />

            {/* Runs Bracket */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground font-body">1st Innings Score</label>
                <div className="flex items-center gap-2">
                   <div className="text-[10px] font-bold text-muted-foreground uppercase">Optional</div>
                   <div className="text-[10px] font-bold bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded">+12 PTS</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {RUNS_BRACKETS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setRunsBracket(runsBracket === b ? '' : b)}
                    className={`px-4 py-2 rounded-lg font-body text-sm font-semibold transition-all border
                      ${runsBracket === b ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border -mx-5 sm:-mx-6" />

            {/* Top Scorer */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase font-bold tracking-wider text-muted-foreground font-body">Top Scorer</label>
                <div className="flex items-center gap-2">
                   <div className="text-[10px] font-bold text-muted-foreground uppercase">Optional</div>
                   <div className="text-[10px] font-bold bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded">+15 PTS</div>
                </div>
              </div>
              <PlayerSearchInput value={topScorer} onChange={setTopScorer} options={allPlayers} />
              {topScorer && (
                <div className="flex items-center justify-between mt-3 px-4 py-3 bg-accent border border-border rounded-xl">
                  <span className="text-sm font-semibold text-foreground">{topScorer}</span>
                  <Button variant="ghost" size="icon" onClick={() => setTopScorer('')} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                    <X size={14} />
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>
        
        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-border bg-card">
           {pointsPreview > 0 && !locked && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide">Potential Setup</span>
              <span className="font-display text-xl font-medium text-foreground">+{pointsPreview} <span className="text-xs text-muted-foreground">PTS</span></span>
            </div>
          )}

          {error && <p className="text-destructive text-xs font-semibold mb-4 text-center bg-destructive/10 py-2 rounded border border-destructive/20">{error}</p>}

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-primary-foreground bg-success shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <Check size={20} /> Locked!
              </motion.div>
            ) : (
              <Button
                key="submit"
                size="lg"
                onClick={handleSubmit}
                disabled={loading || locked || !winner}
                className="w-full py-6 rounded-xl font-semibold gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Trophy size={18} />
                    {existingPrediction ? 'Update Pick' : 'Lock Pick'}
                  </>
                )}
              </Button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
