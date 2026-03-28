import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminSupabase } from '@/lib/supabase/admin'

const ScoreSchema = z.object({
  matchId: z.string().uuid(),
  adminFingerprint: z.string().min(4),
  result: z.object({
    winner: z.string().min(2).max(10),
    runsHome: z.number().int().min(0),
    runsAway: z.number().int().min(0),
    wicketsHome: z.number().int().min(0).max(10),
    wicketsAway: z.number().int().min(0).max(10),
    totalRuns: z.number().int().min(0),
    runsBracket: z.enum(['140-160', '161-180', '181-200', '200+']),
    manOfMatch: z.string().max(60),
  }),
})

function getRunsBracket(runs: number): string {
  if (runs <= 160) return '140-160'
  if (runs <= 180) return '161-180'
  if (runs <= 200) return '181-200'
  return '200+'
}

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 415 })
    }

    const body = await req.json()
    const parsed = ScoreSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { matchId, adminFingerprint, result } = parsed.data

    // Verify match exists and get room info
    const { data: match } = await adminSupabase
      .from('matches')
      .select('id, status')
      .eq('id', matchId)
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Find which room this scoring request is for, and verify admin
    const { data: predList } = await adminSupabase
      .from('predictions')
      .select(`id, player_id, room_id, predicted_winner, predicted_runs_bracket, predicted_top_scorer, players!inner(id, total_points, correct_predictions, total_predictions, streak, max_streak, room_id)`)
      .eq('match_id', matchId)

    if (!predList || predList.length === 0) {
      // Still update match status
      await adminSupabase.from('matches').update({
        status: 'completed',
        result_winner: result.winner,
        result_runs_home: result.runsHome,
        result_runs_away: result.runsAway,
        result_wickets_home: result.wicketsHome,
        result_wickets_away: result.wicketsAway,
        result_total_runs: result.totalRuns,
        result_runs_bracket: result.runsBracket,
        result_man_of_match: result.manOfMatch,
      }).eq('id', matchId)

      return NextResponse.json({ scored: 0, message: 'No predictions to score' })
    }

    // Verify admin is admin of at least one room these predictions belong to
    const roomIds = [...new Set(predList.map((p) => p.room_id))]
    const { data: rooms } = await adminSupabase
      .from('rooms')
      .select('id, admin_fingerprint')
      .in('id', roomIds)
      .eq('admin_fingerprint', adminFingerprint)

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'Unauthorized — not admin of this room' }, { status: 403 })
    }

    const authorizedRoomIds = new Set(rooms.map((r) => r.id))
    const authedPreds = predList.filter((p) => authorizedRoomIds.has(p.room_id))

    // Update match result
    await adminSupabase.from('matches').update({
      status: 'completed',
      result_winner: result.winner,
      result_runs_home: result.runsHome,
      result_runs_away: result.runsAway,
      result_wickets_home: result.wicketsHome,
      result_wickets_away: result.wicketsAway,
      result_total_runs: result.totalRuns,
      result_runs_bracket: result.runsBracket,
      result_man_of_match: result.manOfMatch,
    }).eq('id', matchId)

    // Score each prediction
    const playerPointsMap: Record<string, { gained: number; winnerCorrect: boolean }> = {}
    const predUpdates = []

    for (const pred of authedPreds) {
      const winnerCorrect = pred.predicted_winner === result.winner
      const runsCorrect = pred.predicted_runs_bracket === result.runsBracket
      const scorerCorrect = pred.predicted_top_scorer?.toLowerCase() === result.manOfMatch.toLowerCase()

      const player = pred.players as unknown as { id: string; streak: number; max_streak: number; total_points: number; correct_predictions: number; total_predictions: number }

      // Streak check: if winner correct, streak++; else reset
      const newStreak = winnerCorrect ? (player.streak ?? 0) + 1 : 0
      const streakMultiplier = (player.streak ?? 0) >= 3 && winnerCorrect ? 1.5 : 1

      let pts = 0
      if (winnerCorrect) pts += 10
      if (runsCorrect) pts += 12
      if (scorerCorrect) pts += 15
      pts = Math.round(pts * streakMultiplier)

      predUpdates.push({
        id: pred.id,
        winner_correct: winnerCorrect,
        runs_correct: runsCorrect,
        scorer_correct: scorerCorrect,
        points_earned: pts,
        is_locked: true,
        scored_at: new Date().toISOString(),
      })

      playerPointsMap[pred.player_id] = {
        gained: pts,
        winnerCorrect,
      }
    }

    // Bulk update predictions
    for (const update of predUpdates) {
      await adminSupabase.from('predictions').update(update).eq('id', update.id)
    }

    // Bulk update players
    for (const [playerId, { gained, winnerCorrect }] of Object.entries(playerPointsMap)) {
      const player = authedPreds.find((p) => p.player_id === playerId)?.players as unknown as {
        id: string; streak: number; max_streak: number; total_points: number; correct_predictions: number; total_predictions: number
      }
      if (!player) continue

      const newStreak = winnerCorrect ? (player.streak ?? 0) + 1 : 0
      const newMaxStreak = Math.max(player.max_streak ?? 0, newStreak)

      await adminSupabase.from('players').update({
        total_points: (player.total_points ?? 0) + gained,
        correct_predictions: winnerCorrect ? (player.correct_predictions ?? 0) + 1 : (player.correct_predictions ?? 0),
        total_predictions: (player.total_predictions ?? 0) + 1,
        streak: newStreak,
        max_streak: newMaxStreak,
        last_active: new Date().toISOString(),
      }).eq('id', playerId)
    }

    return NextResponse.json({
      success: true,
      scored: predUpdates.length,
      result: {
        winner: result.winner,
        runsBracket: result.runsBracket,
        manOfMatch: result.manOfMatch,
      },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
