// src/lib/cricket-sync.ts
import { NormalizedScorecard } from './cricket-api-complete'
import { adminSupabase } from './supabase/admin'

/**
 * Core Scoring Engine for IPL Adda
 * This function processes all predictions for a match and distributes points
 * based on winner, runs bracket, and top scorer accuracy.
 */
export async function scorePredictions(matchId: string, scorecard: NormalizedScorecard) {
  console.log(`[scoring-engine] Starting scoring for match ${matchId}...`)

  // 1. Fetch all locked predictions for this match that haven't been scored yet
  const { data: preds, error: fetchError } = await adminSupabase
    .from('predictions')
    .select('*, players!inner(id, streak, max_streak, total_points, correct_predictions, total_predictions)')
    .eq('match_id', matchId)
    .eq('is_locked', true)
    .is('points_earned', null)

  if (fetchError) {
    console.error('[scoring-engine] Failed to fetch predictions:', fetchError)
    return
  }

  if (!preds || preds.length === 0) {
    console.log('[scoring-engine] No pending predictions to score for this match.')
    return
  }

  console.log(`[scoring-engine] Processing ${preds.length} predictions...`)

  for (const pred of preds) {
    try {
      const player = pred.players as any
      if (!player) continue

      // A. Comparison Logic
      const winnerCorrect = pred.predicted_winner === scorecard.winner
      const runsCorrect = pred.predicted_runs_bracket === scorecard.runsBracket
      const scorerCorrect = pred.predicted_top_scorer?.toLowerCase() === scorecard.manOfMatch?.toLowerCase()

      // B. Multiplier & Streak Logic
      const newStreak = winnerCorrect ? (player.streak ?? 0) + 1 : 0
      // 3+ streak gives 1.5x multiplier for the Winner point
      const streakMultiplier = (player.streak ?? 0) >= 3 && winnerCorrect ? 1.5 : 1

      // C. Base Point Calculation
      let pts = 0
      if (winnerCorrect) pts += 10
      if (runsCorrect) pts += 12
      if (scorerCorrect) pts += 15
      
      // Apply streak bonus to the entire bucket
      pts = Math.round(pts * streakMultiplier)

      // D. Update Prediction Result
      const { error: predError } = await adminSupabase
        .from('predictions')
        .update({
          winner_correct: winnerCorrect,
          runs_correct: runsCorrect,
          scorer_correct: scorerCorrect,
          points_earned: pts,
          scored_at: new Date().toISOString(),
        })
        .eq('id', pred.id)

      if (predError) throw predError

      // E. Update Player Profile (Total points and streaks)
      const { error: pUpdateError } = await adminSupabase
        .from('players')
        .update({
          total_points: (player.total_points ?? 0) + pts,
          correct_predictions: winnerCorrect ? (player.correct_predictions ?? 0) + 1 : (player.correct_predictions ?? 0),
          total_predictions: (player.total_predictions ?? 0) + 1,
          streak: newStreak,
          max_streak: Math.max(player.max_streak ?? 0, newStreak),
          last_active: new Date().toISOString(),
        })
        .eq('id', pred.player_id)

      if (pUpdateError) throw pUpdateError

    } catch (e) {
      console.error(`[scoring-engine] Error scoring prediction ${pred.id}:`, e)
    }
  }

  console.log('[scoring-engine] Scoring completed successfully.')
}
