import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminSupabase } from '@/lib/supabase/admin'

const SubmitSchema = z.object({
  playerId: z.string().uuid(),
  matchId: z.string().uuid(),
  roomId: z.string().uuid(),
  predictedWinner: z.string().min(2).max(10),
  predictedRunsBracket: z.enum(['140-160', '161-180', '181-200', '200+']).optional(),
  predictedTopScorer: z.string().max(50).optional(),
})

export async function POST(req: NextRequest) {
  try {
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 415 })
    }

    const body = await req.json()
    const parsed = SubmitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { playerId, matchId, roomId, predictedWinner, predictedRunsBracket, predictedTopScorer } = parsed.data

    // Verify match exists and lock_time hasn't passed
    const { data: match, error: matchError } = await adminSupabase
      .from('matches')
      .select('id, lock_time, status, team_home, team_away')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (new Date(match.lock_time) < new Date()) {
      return NextResponse.json({ error: 'Prediction window closed — match locked' }, { status: 403 })
    }

    // Verify predicted winner is one of the teams
    if (predictedWinner !== match.team_home && predictedWinner !== match.team_away) {
      return NextResponse.json({ error: 'Invalid winner — must be one of the teams' }, { status: 400 })
    }

    // Verify player belongs to room
    const { data: player } = await adminSupabase
      .from('players')
      .select('id')
      .eq('id', playerId)
      .eq('room_id', roomId)
      .single()

    if (!player) {
      return NextResponse.json({ error: 'Player not in this room' }, { status: 403 })
    }

    // Upsert prediction
    const { data: prediction, error: predError } = await adminSupabase
      .from('predictions')
      .upsert({
        player_id: playerId,
        match_id: matchId,
        room_id: roomId,
        predicted_winner: predictedWinner,
        predicted_runs_bracket: predictedRunsBracket ?? null,
        predicted_top_scorer: predictedTopScorer ?? null,
        is_locked: false,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'player_id,match_id' })
      .select()
      .single()

    if (predError || !prediction) {
      return NextResponse.json({ error: 'Failed to save prediction' }, { status: 500 })
    }

    // Update player total_predictions count (best effort)
    try {
      await adminSupabase.rpc('increment_prediction_count', { p_player_id: playerId })
    } catch {
      // RPC may not exist, ignore
    }

    return NextResponse.json({ success: true, prediction })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
