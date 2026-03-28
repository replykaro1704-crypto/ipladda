'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Play, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
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

  if (!match) {
    return (
      <div className="clean-card !p-4 border-[#222]">
        <div className="flex items-center gap-2 text-[#A1A1AA] mb-2">
          <Settings size={14} />
          <span className="font-body text-xs font-bold uppercase tracking-wider">Admin</span>
        </div>
        <p className="text-[#52525B] text-sm">No upcoming match to manage.</p>
      </div>
    )
  }

  return (
    <div className="clean-card !p-4 border-[#222] bg-[#111]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2 text-[#A1A1AA] group-hover:text-white transition-colors">
          <Settings size={14} className={expanded ? 'text-white' : ''} />
          <span className={`font-body text-xs font-bold uppercase tracking-wider ${expanded ? 'text-white' : ''}`}>Admin Settings</span>
        </div>
        <div className="text-[#52525B] group-hover:text-white transition-colors">
           {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-[#222] space-y-5"
          >
            <div className="flex flex-col gap-1">
              <span className="font-body text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">Score Match #{match.match_number}</span>
              <span className="font-display text-lg tracking-tight font-medium">{match.team_home} vs {match.team_away}</span>
            </div>

            {/* Winner */}
            <div>
              <label className="block text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider mb-2">Winner *</label>
              <div className="flex gap-2">
                {[match.team_home, match.team_away].map((t) => (
                  <button key={t}
                    onClick={() => setWinner(winner === t ? '' : t)}
                    className={`flex-1 py-3 rounded-lg font-display text-lg font-medium transition-all border ${winner === t ? 'bg-white text-black border-white' : 'bg-[#1A1A1A] text-[#A1A1AA] border-[#333]'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Runs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold mb-1">{match.team_home} Runs</label>
                <input className="clean-input !py-2.5 text-sm" type="number" min="0" max="300" value={runsHome} onChange={(e) => setRunsHome(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold mb-1">{match.team_away} Runs</label>
                <input className="clean-input !py-2.5 text-sm" type="number" min="0" max="300" value={runsAway} onChange={(e) => setRunsAway(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold mb-1">{match.team_home} Wkts</label>
                <input className="clean-input !py-2.5 text-sm" type="number" min="0" max="10" value={wicketsHome} onChange={(e) => setWicketsHome(e.target.value)} placeholder="0-10" />
              </div>
              <div>
                <label className="block text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold mb-1">{match.team_away} Wkts</label>
                <input className="clean-input !py-2.5 text-sm" type="number" min="0" max="10" value={wicketsAway} onChange={(e) => setWicketsAway(e.target.value)} placeholder="0-10" />
              </div>
            </div>

            {/* Runs Bracket */}
            <div>
              <label className="block text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider mb-2">Runs Bracket (Winner) *</label>
              <div className="flex flex-wrap gap-2">
                {RUNS_BRACKETS.map((b) => (
                  <button key={b}
                    onClick={() => setRunsBracket(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${runsBracket === b ? 'bg-white text-black border-white' : 'bg-[#1A1A1A] text-[#A1A1AA] border-[#333] hover:border-[#555]'}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Man of Match */}
            <div>
              <label className="block text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider mb-2">Man of Match</label>
              <input className="clean-input text-sm !py-2.5" value={manOfMatch} onChange={(e) => setManOfMatch(e.target.value)} placeholder="Player name" />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2 rounded bg-[#EF4444]/10 text-[#EF4444] text-xs font-semibold border border-[#EF4444]/20">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            {message && (
              <div className="flex items-center gap-2 p-2 rounded bg-[#10B981]/10 text-[#10B981] text-xs font-semibold border border-[#10B981]/20">
                <CheckCircle size={14} /> {message}
              </div>
            )}

            <button
              onClick={handleScore}
              disabled={loading || !winner || !runsBracket}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${loading || !winner || !runsBracket ? 'bg-[#1A1A1A] text-[#52525B] border border-[#333] cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Scoring...</>
              ) : (
                <><Play size={14} /> Score Predictions</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
