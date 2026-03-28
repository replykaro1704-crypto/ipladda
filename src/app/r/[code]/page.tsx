'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Users, Share2, ArrowLeft, Calendar, CheckCircle2, XCircle, Minus } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { getFingerprint, getPlayerSession, savePlayerSession } from '@/lib/fingerprint'
import { useGameStore } from '@/store/useGameStore'
import type { Room, Match, Prediction } from '@/store/useGameStore'

import JoinOverlay from '@/components/JoinOverlay'
import Navigation, { type TabKey } from '@/components/Navigation'
import MatchCard from '@/components/MatchCard'
import LiveLeaderboard from '@/components/LiveLeaderboard'
import PredictionForm from '@/components/PredictionForm'
import AdminPanel from '@/components/AdminPanel'
import RoomInvite from '@/components/RoomInvite'
import MatchCountdown from '@/components/MatchCountdown'
import SeasonPredictions from '@/components/SeasonPredictions'

// ─── Join flow ────────────────────────────────────────────────
async function joinRoom(roomId: string, name: string, fingerprint: string) {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .eq('fingerprint', fingerprint)
    .single()

  if (existing) return existing

  const { data: player, error } = await supabase
    .from('players')
    .insert({ room_id: roomId, display_name: name, fingerprint })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return player
}

// ─── Predict Tab ──────────────────────────────────────────────
function PredictTab({
  matches, currentPlayerId, roomId, predictions, isAdmin, room, onRefresh,
}: {
  matches: Match[], currentPlayerId: string, roomId: string,
  predictions: Prediction[], isAdmin: boolean, room: Room, onRefresh: () => void
}) {
  const [predictingMatch, setPredictingMatch] = useState<Match | null>(null)

  const upcoming = matches.filter((m) => m.status === 'upcoming')
  const live = matches.filter((m) => m.status === 'live')
  const nextMatch = live[0] ?? upcoming[0]

  function getPrediction(matchId: string) {
    return predictions.find((p) => p.match_id === matchId)
  }

  return (
    <div className="space-y-6 pb-24">
      {isAdmin && (
        <AdminPanel match={nextMatch ?? null} roomId={roomId} onMatchUpdated={onRefresh} />
      )}

      {live.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="live-dot text-[#F59E0B]" />
            <span className="font-display text-sm font-semibold uppercase tracking-wider text-[#F59E0B]">Live Now</span>
          </div>
          <div className="space-y-4">
            {live.map((m) => (
              <MatchCard key={m.id} match={m} compact={false}
                hasPrediction={!!getPrediction(m.id)}
                onPredict={() => setPredictingMatch(m)}
              />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} className="text-[#A1A1AA]" />
            <span className="font-display text-sm font-semibold uppercase tracking-wider text-[#A1A1AA]">Upcoming Matches</span>
          </div>
          <div className="space-y-4">
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m}
                hasPrediction={!!getPrediction(m.id)}
                onPredict={() => setPredictingMatch(m)}
              />
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && live.length === 0 && (
        <div className="clean-card text-center py-16">
          <div className="text-3xl mb-4 text-[#52525B]">🏏</div>
          <h3 className="font-display text-2xl font-medium mb-2">No Matches Scheduled</h3>
          <p className="text-[#A1A1AA] text-sm font-body">Check back later for upcoming fixtures.</p>
        </div>
      )}

      <AnimatePresence>
        {predictingMatch && (
          <PredictionForm
            match={predictingMatch}
            playerId={currentPlayerId}
            roomId={roomId}
            existingPrediction={getPrediction(predictingMatch.id)}
            onClose={() => setPredictingMatch(null)}
            onSubmitted={(pred) => {
              useGameStore.getState().upsertPrediction(pred)
              setPredictingMatch(null)
              onRefresh()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── History Tab ──────────────────────────────────────────────
function HistoryTab({
  matches, predictions, currentPlayerId,
}: {
  matches: Match[], predictions: Prediction[], currentPlayerId: string
}) {
  const completed = [...matches.filter((m) => m.status === 'completed')].reverse()

  const myPreds = predictions.filter((p) => p.player_id === currentPlayerId && p.points_earned !== undefined)
  const totalPts = myPreds.reduce((s, p) => s + (p.points_earned ?? 0), 0)
  const correct = myPreds.filter((p) => p.winner_correct).length

  if (completed.length === 0) {
    return (
      <div className="clean-card text-center py-16 pb-24">
        <div className="text-3xl mb-4 text-[#52525B]">📊</div>
        <h3 className="font-display text-2xl font-medium mb-2">No History Yet</h3>
        <p className="text-[#A1A1AA] text-sm">Completed match results will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="clean-card grid grid-cols-3 gap-4 !p-6 border border-[#222]">
        <div className="text-center">
          <div className="font-display text-3xl font-medium text-white">{totalPts}</div>
          <div className="font-body text-xs text-[#A1A1AA] uppercase tracking-wider mt-1">Total Pts</div>
        </div>
        <div className="text-center border-l border-r border-[#222]">
          <div className="font-display text-3xl font-medium text-[#10B981]">{correct}</div>
          <div className="font-body text-xs text-[#A1A1AA] uppercase tracking-wider mt-1">Correct</div>
        </div>
        <div className="text-center">
          <div className="font-display text-3xl font-medium text-white">{completed.length}</div>
          <div className="font-body text-xs text-[#A1A1AA] uppercase tracking-wider mt-1">Matches</div>
        </div>
      </div>

      <div className="space-y-4">
      {completed.map((match, idx) => {
        const pred = predictions.find((p) => p.match_id === match.id && p.player_id === currentPlayerId)
        const won = pred?.winner_correct
        return (
          <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className={`rounded-xl overflow-hidden bg-[#0A0A0A] border
              ${won ? 'border-[#10B981]/30' : pred ? 'border-[#EF4444]/20' : 'border-[#222]'}`}>
            
            <div className={`h-[2px] w-full ${won ? 'bg-[#10B981]' : pred ? 'bg-[#EF4444]' : 'bg-[#333]'}`} />

            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-medium">{match.team_home}</span>
                  <span className="font-body text-xs text-[#52525B]">vs</span>
                  <span className="font-display text-xl font-medium">{match.team_away}</span>
                </div>
                <div className="text-right">
                  <div className="font-body text-xs text-[#A1A1AA]">{format(new Date(match.match_time), 'MMM d')}</div>
                  {match.result_winner && (
                    <div className="font-body text-xs font-semibold mt-1 text-[#10B981]">
                      {match.result_winner} won
                    </div>
                  )}
                </div>
              </div>

              {pred ? (
                <div className="flex items-center justify-between pt-4 border-t border-[#222]">
                  <div className="flex items-center gap-2">
                    <PredBadge label="Winner" correct={pred.winner_correct} />
                    {pred.predicted_runs_bracket != null && <PredBadge label="Runs" correct={pred.runs_correct} />}
                    {pred.predicted_top_scorer != null && <PredBadge label="Scorer" correct={pred.scorer_correct} />}
                  </div>
                  <div className={`font-display text-2xl font-medium ${pred.points_earned > 0 ? 'text-white' : 'text-[#52525B]'}`}>
                    +{pred.points_earned}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-4 border-t border-[#222] text-[#52525B]">
                  <Minus size={14} />
                  <span className="font-body text-xs">No prediction submitted</span>
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
      </div>
    </div>
  )
}

function PredBadge({ label, correct }: { label: string; correct?: boolean | null }) {
  if (correct == null) return null
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded shadow-sm font-body text-xs font-medium border
      ${correct ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'}`}>
      {correct ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {label}
    </div>
  )
}

// ─── Room Info Tab ────────────────────────────────────────────
function RoomTab({
  room, players, currentPlayerId, onShowInvite,
}: {
  room: Room, players: { id: string; display_name: string; total_points: number }[],
  currentPlayerId: string, onShowInvite: () => void
}) {
  return (
    <div className="space-y-6 pb-24">
      <div className="clean-card !p-6 border border-[#222]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="font-display text-xs text-[#A1A1AA] uppercase tracking-widest mb-1">IPL 2026 Room</div>
            <h3 className="font-display text-2xl font-medium tracking-tight mb-1">{room.name}</h3>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-medium tracking-widest">{room.code}</div>
            <div className="font-body text-xs text-[#A1A1AA]">Access Code</div>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 rounded-xl bg-[#111] border border-[#222] py-4 text-center">
            <div className="font-display text-2xl font-medium">{players.length}</div>
            <div className="font-body text-xs text-[#A1A1AA]">Players</div>
          </div>
          <div className="flex-1 rounded-xl bg-[#111] border border-[#222] py-4 text-center">
            <div className="font-display text-2xl font-medium">2026</div>
            <div className="font-body text-xs text-[#A1A1AA]">Season</div>
          </div>
        </div>

        <button onClick={onShowInvite} className="clean-btn w-full">
          <Share2 size={16} /> Invite Friends
        </button>
      </div>

      <div className="clean-card !p-0 overflow-hidden border border-[#222]">
        <div className="px-6 py-4 bg-[#111] flex flex-row items-center justify-between border-b border-[#222]">
          <h4 className="font-display text-sm uppercase tracking-widest font-medium flex items-center gap-2 text-[#A1A1AA]">
            <Users size={14} /> Rosters
          </h4>
        </div>
        <div className="divide-y divide-[#222]">
          {[...players].sort((a, b) => b.total_points - a.total_points).map((p, i) => (
            <div key={p.id} className={`flex items-center justify-between px-6 py-4 transition-colors
              ${p.id === currentPlayerId ? 'bg-white/5' : 'bg-transparent'}`}>
              <div className="flex items-center gap-4">
                <span className="font-display text-sm text-[#52525B] w-4">{i + 1}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-lg font-medium border
                  ${p.id === currentPlayerId ? 'bg-white text-black border-white' : 'bg-[#1A1A1A] text-[#A1A1AA] border-[#333]'}`}>
                  {p.display_name[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-center items-center gap-2">
                    <span className={`text-sm font-medium font-body ${p.id === currentPlayerId ? 'text-white' : 'text-[#A1A1AA]'}`}>
                      {p.display_name}
                    </span>
                    {p.id === currentPlayerId && (
                      <span className="text-[10px] font-semibold bg-white text-black px-1.5 py-0.5 rounded">YOU</span>
                    )}
                  </div>
                </div>
              </div>
              <span className={`font-display text-lg font-medium ${p.id === currentPlayerId ? 'text-white' : 'text-[#A1A1AA]'}`}>
                {p.total_points}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Room Page ───────────────────────────────────────────
export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()

  const [roomData, setRoomData] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('predict')

  const {
    currentPlayer, setPlayer, setRoom,
    players, setPlayers,
    matches, setMatches,
    predictions, setPredictions,
    isAdmin, setIsAdmin,
  } = useGameStore()

  const room = roomData

  useEffect(() => {
    async function loadRoom() {
      const supabase = createClient()

      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code.toUpperCase())
        .single()

      if (!roomData) { setNotFound(true); setLoading(false); return }

      setRoomData(roomData)
      setRoom(roomData)

      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('total_points', { ascending: false })

      if (playersData) setPlayers(playersData)

      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .order('match_number')

      if (matchesData) setMatches(matchesData)

      const fp = getFingerprint()
      const existingPlayer = playersData?.find((p) => p.fingerprint === fp)

      if (existingPlayer) {
        setPlayer(existingPlayer)
        setIsAdmin(existingPlayer.fingerprint === roomData.admin_fingerprint)

        if (matchesData) {
          const matchIds = matchesData.map((m) => m.id)
          const { data: predsData } = await supabase
            .from('predictions')
            .select('*')
            .eq('player_id', existingPlayer.id)
            .in('match_id', matchIds)

          if (predsData) setPredictions(predsData)
        }
      } else {
        setShowJoin(true)
      }

      setLoading(false)
    }

    loadRoom()
  }, [code])

  async function handleJoin(name: string) {
    if (!room) return
    const fp = getFingerprint()
    const player = await joinRoom(room.id, name, fp)
    setPlayer(player)
    savePlayerSession(name, code)
    setIsAdmin(fp === room.admin_fingerprint)
    setPlayers([...(players ?? []), player])
    setShowJoin(false)
  }

  function handleRefresh() {
    const supabase = createClient()
    supabase.from('matches').select('*').order('match_number').then(({ data }) => {
      if (data) setMatches(data)
    })
    if (currentPlayer) {
      supabase.from('predictions').select('*').eq('player_id', currentPlayer.id).then(({ data }) => {
        if (data) setPredictions(data)
      })
    }
  }

  const upcomingMatches = matches.filter((m) => m.status === 'upcoming')
  const nextMatch = upcomingMatches[0]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#333] border-t-white animate-spin mb-4" />
          <p className="font-body text-sm text-[#A1A1AA] uppercase tracking-widest">Loading Room</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="clean-card max-w-sm w-full text-center border-[#EF4444]/20">
          <div className="text-4xl mb-4">🤷</div>
          <h2 className="font-display text-2xl font-medium mb-2">Room not found</h2>
          <p className="text-[#A1A1AA] text-sm mb-6">Double check your code: <strong className="text-white">{code}</strong></p>
          <button onClick={() => router.push('/')} className="clean-btn w-full">
            Return Home
          </button>
        </div>
      </div>
    )
  }

  if (!room) return null

  return (
    <div className="min-h-screen flex flex-col pt-16">
      <header className="fixed top-0 inset-x-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#222]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex flex-row items-center gap-4">
             <button onClick={() => router.push('/')} className="p-2 hover:bg-[#222] rounded-full transition-colors text-[#A1A1AA]">
               <ArrowLeft size={18} />
             </button>
             <div className="flex flex-col">
               <span className="font-display text-lg font-medium tracking-tight leading-tight">{room.name}</span>
               <span className="font-body text-[10px] text-[#A1A1AA] uppercase tracking-wider">{players.length} Players • Code: {room.code}</span>
             </div>
          </div>
          <button onClick={() => setShowInvite(true)} 
            className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#222] border border-[#333] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
            <Share2 size={14} /> Invite
          </button>
        </div>
      </header>

      {nextMatch && currentPlayer && (
        <div className="max-w-2xl mx-auto w-full px-4 mt-4 hidden sm:block">
          <MatchCountdown match={nextMatch} onPredict={() => setActiveTab('predict')} />
        </div>
      )}

      {currentPlayer && (
        <div className="max-w-2xl mx-auto w-full px-4 py-4">
          <div className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white text-black font-display font-medium flex items-center justify-center text-sm shadow">
                {currentPlayer.display_name[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-body text-sm font-semibold">{currentPlayer.display_name}</span>
                {isAdmin && <span className="text-[9px] uppercase tracking-widest text-[#10B981] font-bold">Admin</span>}
              </div>
            </div>
            <div className="font-display text-xl font-medium tracking-tight">
              {currentPlayer.total_points} <span className="text-xs text-[#52525B] tracking-wider uppercase ml-0.5">PTS</span>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4">
        <AnimatePresence mode="popLayout">
          {activeTab === 'predict' && currentPlayer && (
            <motion.div key="predict" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PredictTab
                matches={matches}
                currentPlayerId={currentPlayer.id}
                roomId={room.id}
                predictions={predictions}
                isAdmin={isAdmin}
                room={room}
                onRefresh={handleRefresh}
              />
            </motion.div>
          )}

          {activeTab === 'leaderboard' && currentPlayer && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <LiveLeaderboard roomId={room.id} currentPlayerId={currentPlayer.id} />
            </motion.div>
          )}

          {activeTab === 'history' && currentPlayer && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HistoryTab matches={matches} predictions={predictions} currentPlayerId={currentPlayer.id} />
            </motion.div>
          )}

          {activeTab === 'room' && currentPlayer && (
            <motion.div key="room" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="space-y-6">
                <RoomTab room={room} players={players} currentPlayerId={currentPlayer.id} onShowInvite={() => setShowInvite(true)} />
                <SeasonPredictions playerId={currentPlayer.id} roomId={room.id} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {currentPlayer && (
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <AnimatePresence>
        {showJoin && (
          <JoinOverlay roomName={room.name} playerCount={players.length} onJoin={handleJoin} />
        )}
        {showInvite && (
          <RoomInvite roomCode={room.code} roomName={room.name} onClose={() => setShowInvite(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
