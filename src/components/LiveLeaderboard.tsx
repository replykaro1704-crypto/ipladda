'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/store/useGameStore'
import type { Player } from '@/store/useGameStore'
import { Trophy } from 'lucide-react'
import { Card } from '@/components/ui/card'

// ─── Podium top 3 ─────────────────────────────────────────────
function Podium({ players, currentPlayerId }: { players: Player[]; currentPlayerId?: string }) {
  const top3 = players.slice(0, 3)
  if (top3.length === 0) return null

  const order = [top3[1], top3[0], top3[2]].filter(Boolean)
  const ranks = [2, 1, 3]
  const heights = [60, 84, 48]
  const colors = [
    'bg-[#E4E4E7] text-black border-[#A1A1AA]', // 2nd (Silver)
    'bg-[#FBBF24] text-black border-[#F59E0B]', // 1st (Gold)
    'bg-[#D4A373] text-black border-[#B5835A]'  // 3rd (Bronze)
  ]

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 pt-6">
      {order.map((player, i) => {
        if (!player) return null
        const isCurrent = player.id === currentPlayerId
        const rank = ranks[i]
        const colorClass = colors[rank - 1]

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-3 w-[88px] sm:w-[104px]"
          >
            <div className="relative">
              <motion.div
                animate={rank === 1 ? { y: [0, -4, 0] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-display text-xl sm:text-2xl font-bold border-2 ${colorClass}`}
                style={isCurrent ? { boxShadow: '0 0 0 3px white' } : {}}
              >
                {player.display_name[0].toUpperCase()}
              </motion.div>
              {isCurrent && (
                <div className="absolute -top-2 -right-2 bg-white text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                  YOU
                </div>
              )}
            </div>

            <div className="text-center w-full">
              <div className={`font-body text-xs font-semibold truncate px-1 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                {player.display_name}
              </div>
              <div className="font-display text-lg sm:text-2xl font-medium tracking-tight mt-0.5">
                {player.total_points}
              </div>
              <div className="font-body text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">pts</div>
            </div>

            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.1 + 0.2, type: 'spring', stiffness: 200 }}
              className={`w-full rounded-t-xl opacity-20 border-t ${colorClass}`}
              style={{
                height: heights[i],
                transformOrigin: 'bottom',
              }}
            />
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Rank badge ────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm bg-amber-500/20 border border-amber-500 text-amber-500 shrink-0">1</div>
  if (rank === 2) return <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm bg-zinc-200/20 border border-zinc-200 text-zinc-200 shrink-0">2</div>
  if (rank === 3) return <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm bg-orange-300/20 border border-orange-300 text-orange-300 shrink-0">3</div>
  
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-medium text-sm bg-accent border border-border text-muted-foreground shrink-0">
      {rank}
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────
function LeaderboardRow({ player, rank, isCurrentPlayer, pointsDelta }: {
  player: Player; rank: number; isCurrentPlayer: boolean; pointsDelta: number
}) {
  const accuracy = player.total_predictions > 0
    ? Math.round((player.correct_predictions / player.total_predictions) * 100)
    : 0

  return (
    <motion.div
      layout
      layoutId={player.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors
        ${isCurrentPlayer ? 'bg-accent/50 border-border' : 'bg-transparent border-transparent hover:bg-accent'}`}
    >
      <RankBadge rank={rank} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-body text-sm font-semibold truncate ${isCurrentPlayer ? 'text-primary' : 'text-muted-foreground'}`}>
            {player.display_name}
          </span>
          {isCurrentPlayer && (
            <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>
          )}
          {player.streak >= 3 && (
            <span className="text-sm" title={`${player.streak} match streak`}>
              {player.streak >= 5 ? '🔥🔥' : '🔥'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] mt-1 font-body font-medium uppercase tracking-wider">
          <span>{player.correct_predictions}/{player.total_predictions} correct</span>
          {player.total_predictions > 0 && (
            <>
              <span>·</span>
              <span>{accuracy}%</span>
            </>
          )}
        </div>
      </div>

      <div className="relative shrink-0 text-right">
        <div className={`font-display text-2xl font-medium tracking-tight ${isCurrentPlayer ? 'text-primary' : 'text-muted-foreground'}`}>
          {player.total_points}
        </div>
        <AnimatePresence>
          {pointsDelta > 0 && (
            <motion.div
              key={`delta-${Date.now()}`}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -24 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute -top-4 right-0 font-display text-sm font-bold text-[#10B981] pointer-events-none"
            >
              +{pointsDelta}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border border-transparent">
      <div className="w-8 h-8 rounded-full bg-[#111] animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-24 rounded bg-[#111] animate-pulse" />
        <div className="h-2 w-16 rounded bg-[#111] animate-pulse" />
      </div>
      <div className="h-6 w-10 rounded bg-[#111] animate-pulse" />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────
export default function LiveLeaderboard({ roomId, currentPlayerId }: { roomId: string; currentPlayerId?: string }) {
  const { players, setPlayers } = useGameStore()
  const [loading, setLoading] = useState(true)
  const [pointsDeltas, setPointsDeltas] = useState<Record<string, number>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('total_points', { ascending: false })
      .then(({ data }) => {
        if (data) setPlayers(data)
        setLoading(false)
      })
  }, [roomId, setPlayers])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`room-players-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Player
            const old = players.find((p) => p.id === updated.id)
            if (old && updated.total_points > old.total_points) {
              const delta = updated.total_points - old.total_points
              setPointsDeltas((d) => ({ ...d, [updated.id]: delta }))
              setTimeout(() => setPointsDeltas((d) => { const n = { ...d }; delete n[updated.id]; return n }), 2200)
            }
            setPlayers(players.map((p) => p.id === updated.id ? updated : p))
          } else if (payload.eventType === 'INSERT') {
            setPlayers([...players, payload.new as Player])
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [roomId, players, setPlayers])

  const sorted = [...players].sort((a, b) => b.total_points - a.total_points)

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display text-xl font-medium flex items-center gap-2">
          <Trophy size={18} className="text-muted-foreground" /> Leaderboard
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> LIVE
        </div>
      </div>

      {loading ? (
        <Card className="p-0 overflow-hidden bg-card border-border">
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
          </div>
        </Card>
      ) : sorted.length === 0 ? (
        <Card className="text-center py-12 bg-card border-border">
          <div className="text-3xl mb-4 text-muted-foreground">📊</div>
          <p className="font-body text-sm text-muted-foreground">No players yet. Invite your friends!</p>
        </Card>
      ) : (
        <>
          {sorted.length >= 2 && <Podium players={sorted} currentPlayerId={currentPlayerId} />}

          <Card className="p-0 overflow-hidden bg-card border-border">
            <div className="divide-y divide-border">
              <AnimatePresence>
                {sorted.map((player, i) => (
                  <LeaderboardRow
                    key={player.id}
                    player={player}
                    rank={i + 1}
                    isCurrentPlayer={player.id === currentPlayerId}
                    pointsDelta={pointsDeltas[player.id] ?? 0}
                  />
                ))}
              </AnimatePresence>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
