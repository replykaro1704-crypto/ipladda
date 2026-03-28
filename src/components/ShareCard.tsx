'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, X } from 'lucide-react'
import { getTeamColors } from '@/lib/teams'
import type { Player, Match, Prediction } from '@/store/useGameStore'

interface PersonalCardProps {
  player: Player
  match: Match
  prediction: Prediction
  rank: number
  totalPlayers: number
  roomName: string
  roomCode: string
}

interface LeaderboardCardProps {
  players: Player[]
  roomName: string
  roomCode: string
  matchesPlayed: number
  totalMatches: number
}

async function downloadCard(elementId: string, filename: string) {
  const html2canvas = (await import('html2canvas')).default
  const element = document.getElementById(elementId)
  if (!element) return
  const canvas = await html2canvas(element, {
    scale: 3,
    backgroundColor: null,
    logging: false,
    useCORS: true,
  })
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

// ─── Personal Match Card ──────────────────────────────────────
export function PersonalShareCard({ player, match, prediction, rank, totalPlayers, roomName, roomCode }: PersonalCardProps) {
  const [loading, setLoading] = useState(false)
  const cardId = `share-card-personal-${match.id}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ipl-adda.vercel.app'

  const homeTeam = getTeamColors(match.team_home)
  const awayTeam = getTeamColors(match.team_away)

  async function handleDownload() {
    setLoading(true)
    await downloadCard(cardId, `ipl-adda-${match.team_home}-vs-${match.team_away}.png`)
    setLoading(false)
  }

  function shareWhatsApp() {
    const pts = prediction.points_earned
    const msg = `IPL Adda Match #${match.match_number}: I scored ${pts} pts! 🏆 Room: ${roomCode} · ${appUrl}/r/${roomCode}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div>
      {/* Hidden card for capture */}
      <div
        id={cardId}
        style={{
          width: 390, padding: 0, background: '#0A0A0A',
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: 'absolute', left: '-9999px', top: '-9999px',
          border: '1px solid #222', borderRadius: '16px', overflow: 'hidden'
        }}
      >
        <div style={{ padding: '24px 24px 20px', backgroundColor: '#111', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: 10, color: '#A1A1AA', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>
            IPL ADDA 2026 · MATCH #{match.match_number}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: homeTeam.primary }}>{match.team_home}</span>
            <span style={{ color: '#52525B', fontSize: 16, fontWeight: 600 }}>VS</span>
            <span style={{ fontSize: 32, fontWeight: 700, color: awayTeam.primary }}>{match.team_away}</span>
          </div>
          {match.result_winner && (
            <div style={{ marginTop: 12, color: '#10B981', fontSize: 14, fontWeight: 700 }}>
              ✓ {match.result_winner} won
            </div>
          )}
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: 32, color: '#FFF', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {player.display_name}
          </div>
          <div style={{ fontSize: 14, color: '#A1A1AA', fontWeight: 500, marginBottom: 24 }}>
            Rank {rank} of {totalPlayers} in {roomName}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', borderRadius: 8,
              background: prediction.winner_correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${prediction.winner_correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              <span style={{ color: '#A1A1AA', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Winner Pick</span>
              <span style={{ color: prediction.winner_correct ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 700 }}>
                {prediction.predicted_winner} {prediction.winner_correct ? '✓' : '✗'}
              </span>
            </div>

            {prediction.predicted_runs_bracket && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 8,
                background: prediction.runs_correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${prediction.runs_correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                <span style={{ color: '#A1A1AA', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>Runs Bracket</span>
                <span style={{ color: prediction.runs_correct ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 700 }}>
                  {prediction.predicted_runs_bracket} {prediction.runs_correct ? '✓' : '✗'}
                </span>
              </div>
            )}
          </div>

          <div style={{
            padding: '16px 20px', borderRadius: 12,
            background: '#111', border: '1px solid #222',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#A1A1AA', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Points Earned
            </span>
            <span style={{ color: '#FFF', fontSize: 40, fontWeight: 700, letterSpacing: '-0.05em' }}>
              +{prediction.points_earned}
            </span>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #222', display: 'flex', justifyContent: 'space-between', backgroundColor: '#111' }}>
          <span style={{ color: '#52525B', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>
            ipl-adda.vercel.app
          </span>
          <span style={{ color: '#52525B', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>
            Room: {roomCode}
          </span>
        </div>
      </div>

      <div className="flex gap-3 mt-4 w-full">
        <button onClick={handleDownload} disabled={loading} className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors bg-[#1A1A1A] text-white hover:bg-[#222] border border-[#333]">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download size={16} />}
          {loading ? 'Generating...' : 'Save Card'}
        </button>
        <button onClick={shareWhatsApp} className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-colors text-white hover:opacity-90" style={{ background: '#25D366' }}>
          <Share2 size={16} /> WhatsApp
        </button>
      </div>
    </div>
  )
}

// ─── Leaderboard Share Card ───────────────────────────────────
export function LeaderboardShareCard({ players, roomName, roomCode, matchesPlayed, totalMatches }: LeaderboardCardProps) {
  const [loading, setLoading] = useState(false)
  const cardId = 'share-card-leaderboard'
  const top3 = [...players].sort((a, b) => b.total_points - a.total_points).slice(0, 6)

  async function handleDownload() {
    setLoading(true)
    await downloadCard(cardId, `ipl-adda-leaderboard-${roomCode}.png`)
    setLoading(false)
  }

  return (
    <div>
      {/* Hidden card */}
      <div id={cardId} style={{
        width: 420, padding: 0, background: '#0A0A0A', fontFamily: "system-ui, -apple-system, sans-serif",
        position: 'absolute', left: '-9999px', top: '-9999px',
        border: '1px solid #222', borderRadius: '16px', overflow: 'hidden'
      }}>
        <div style={{ padding: '32px 32px 24px', backgroundColor: '#111', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: 10, color: '#A1A1AA', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase' }}>IPL ADDA 2026 LEADERBOARD</div>
          <div style={{ fontSize: 40, color: '#FFF', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{roomName}</div>
          <div style={{ fontSize: 14, color: '#A1A1AA', fontWeight: 500, marginTop: 8 }}>
            {matchesPlayed} matches played · {totalMatches - matchesPlayed} remaining
          </div>
        </div>
        <div style={{ padding: '24px 32px' }}>
          {top3.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px',
              borderRadius: 12, marginBottom: 12,
              background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: i === 0 ? '1px solid rgba(255,255,255,0.2)' : '1px solid #222',
            }}>
              <span style={{ fontSize: 24, width: 32, fontWeight: 700, color: i === 0 ? '#FBBF24' : i === 1 ? '#E4E4E7' : i === 2 ? '#D4A373' : '#52525B' }}>
                 {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <span style={{ flex: 1, fontSize: 18, fontWeight: 600, color: i === 0 ? '#FFF' : '#E4E4E7' }}>{p.display_name}</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#FFF' }}>{p.total_points}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '20px 32px', borderTop: '1px solid #222', backgroundColor: '#111', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#52525B', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>ipl-adda.vercel.app</span>
          <span style={{ color: '#52525B', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>Room: {roomCode}</span>
        </div>
      </div>

      <button onClick={handleDownload} disabled={loading} className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors bg-white text-black hover:bg-gray-200">
        {loading ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Generating...</> : <><Download size={16} /> Download Leaderboard Card</>}
      </button>
    </div>
  )
}

// ─── Share Modal ──────────────────────────────────────────────
interface ShareModalProps {
  player: Player
  match: Match
  prediction: Prediction
  rank: number
  totalPlayers: number
  roomName: string
  roomCode: string
  onClose: () => void
}

export function ShareModal({ player, match, prediction, rank, totalPlayers, roomName, roomCode, onClose }: ShareModalProps) {
  return (
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
        className="w-full max-w-sm bg-[#0A0A0A] sm:rounded-2xl rounded-t-2xl sm:border border-[#222] shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-[#222] flex items-center justify-between">
          <h3 className="font-display text-2xl font-medium tracking-tight">Share Result</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
           <PersonalShareCard
             player={player} match={match} prediction={prediction}
             rank={rank} totalPlayers={totalPlayers} roomName={roomName} roomCode={roomCode}
           />
        </div>
      </motion.div>
    </motion.div>
  )
}
