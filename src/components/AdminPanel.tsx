'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Play, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getFingerprint } from '@/lib/fingerprint'
import { RUNS_BRACKETS } from '@/lib/teams'
import type { Match } from '@/store/useGameStore'

interface AdminPanelProps {
  match: Match | null
  roomId: string
  onMatchUpdated: () => void
}

export default function AdminPanel({ match, roomId, onMatchUpdated }: AdminPanelProps) {
  const [winner, setWinner] = useState('')
  const [runsHome, setRunsHome] = useState('')
  const [runsAway, setRunsAway] = useState('')
  const [wicketsHome, setWicketsHome] = useState('')
  const [wicketsAway, setWicketsAway] = useState('')
  const [manOfMatch, setManOfMatch] = useState('')
  const [runsBracket, setRunsBracket] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)

  async function handleScore() {
    if (!match || !winner || !runsBracket) {
      setError('Winner and runs bracket are required.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const fp = getFingerprint()
      const res = await fetch('/api/matches/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          adminFingerprint: fp,
          result: {
            winner,
            runsHome: Number(runsHome) || 0,
            runsAway: Number(runsAway) || 0,
            wicketsHome: Number(wicketsHome) || 0,
            wicketsAway: Number(wicketsAway) || 0,
            totalRuns: Number(runsHome) || Number(runsAway) || 0,
            runsBracket,
            manOfMatch: manOfMatch.trim(),
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to score')
        return
      }

      setMessage(`${data.scored} predictions scored successfully!`)
      onMatchUpdated()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/admin/sync-ipl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminFingerprint: getFingerprint() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(data.message)
      onMatchUpdated()
    } catch (e: any) {
      setError(e.message || 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  if (!match) {
    return (
      <Card className="p-4 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings size={14} />
            <span className="font-body text-xs font-bold uppercase tracking-wider">Admin</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
            {loading ? 'Syncing...' : 'Sync IPL Schedule'}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">No upcoming match to manage.</p>
        {error && <p className="text-destructive text-xs mt-2">{error}</p>}
        {message && <p className="text-success text-xs mt-2">{message}</p>}
      </Card>
    )
  }

  return (
    <Card className="p-4 border-border bg-accent/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
          <Settings size={14} className={expanded ? 'text-foreground' : ''} />
          <span className={`font-body text-xs font-bold uppercase tracking-wider ${expanded ? 'text-foreground' : ''}`}>Admin Settings</span>
        </div>
        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
           {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-border space-y-5"
          >
            <div className="flex flex-col gap-1">
              <span className="font-body text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Score Match #{match.match_number}</span>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg tracking-tight font-medium text-foreground">{match.team_home} vs {match.team_away}</span>
                <Button variant="outline" size="sm" onClick={handleSync} disabled={loading} className="h-8 py-0 px-2 text-[10px] uppercase font-bold tracking-widest border-border hover:bg-accent/50">
                  {loading ? 'Syncing...' : 'Sync Schedule'}
                </Button>
              </div>
            </div>

            {/* Winner */}
            <div>
              <label className="block text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Winner *</label>
              <div className="flex gap-2">
                {[match.team_home, match.team_away].map((t) => (
                  <button key={t}
                    onClick={() => setWinner(winner === t ? '' : t)}
                    className={`flex-1 py-3 rounded-lg font-display text-lg font-medium transition-all border ${winner === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent text-muted-foreground border-border hover:border-muted-foreground'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Runs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{match.team_home} Runs</label>
                <Input className="py-5 text-sm" type="number" min="0" max="300" value={runsHome} onChange={(e) => setRunsHome(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{match.team_away} Runs</label>
                <Input className="py-5 text-sm" type="number" min="0" max="300" value={runsAway} onChange={(e) => setRunsAway(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{match.team_home} Wkts</label>
                <Input className="py-5 text-sm" type="number" min="0" max="10" value={wicketsHome} onChange={(e) => setWicketsHome(e.target.value)} placeholder="0-10" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{match.team_away} Wkts</label>
                <Input className="py-5 text-sm" type="number" min="0" max="10" value={wicketsAway} onChange={(e) => setWicketsAway(e.target.value)} placeholder="0-10" />
              </div>
            </div>

            {/* Runs Bracket */}
            <div>
              <label className="block text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Runs Bracket (Winner) *</label>
              <div className="flex flex-wrap gap-2">
                {RUNS_BRACKETS.map((b) => (
                  <button key={b}
                    onClick={() => setRunsBracket(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${runsBracket === b ? 'bg-primary text-primary-foreground border-primary' : 'bg-accent text-muted-foreground border-border hover:border-muted-foreground'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Man of Match */}
            <div>
              <label className="block text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Man of Match</label>
              <Input className="py-5 text-sm" value={manOfMatch} onChange={(e) => setManOfMatch(e.target.value)} placeholder="Player name" />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded bg-destructive/10 text-destructive text-xs font-semibold border border-destructive/20">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            {message && (
              <div className="flex items-center gap-2 p-3 rounded bg-success/10 text-success text-xs font-semibold border border-success/20">
                <CheckCircle size={14} /> {message}
              </div>
            )}

            <Button
              size="lg"
              onClick={handleScore}
              disabled={loading || !winner || !runsBracket}
              className="w-full gap-2 rounded-xl"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Scoring...</>
              ) : (
                <><Play size={14} /> Score Predictions</>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
