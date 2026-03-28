import { getMatchScorecard, getPlayingXI, getLiveScore } from '@/lib/cricket-api-complete'
import { adminSupabase } from '@/lib/supabase/admin'
import { scorePredictions } from '@/lib/cricket-sync'

export async function GET(req: Request) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get matches that need syncing
  const { data: matches } = await adminSupabase
    .from('matches')
    .select('id, ext_rapidapi_id, ext_cricketdata_id, ext_entity_id, status, match_time')
    .or('status.eq.live,status.eq.upcoming')
    .not('ext_rapidapi_id', 'is', null)

  const results = []

  for (const m of matches || []) {
    const matchTime = new Date(m.match_time)
    const now = new Date()
    const hoursAgo = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60)

    if (m.status === 'live') {
      // Get live score
      const live = await getLiveScore(m.ext_rapidapi_id!)
      if (live) {
        await adminSupabase.from('matches').update({
          live_home_score: live.homeScore,
          live_away_score: live.awayScore,
          live_updated_at: new Date().toISOString(),
        }).eq('id', m.id)
      }

      // If match > 3.5 hours old, try to get scorecard
      if (hoursAgo > 3.5) {
        const scorecard = await getMatchScorecard(
          m.ext_rapidapi_id!,
          m.ext_cricketdata_id || undefined,
          m.ext_entity_id || undefined
        )
        if (scorecard) {
          await adminSupabase.from('matches').update({
            status: 'completed',
            result_winner: scorecard.winner,
            result_total_runs: scorecard.highestTotal,
            result_runs_bracket: scorecard.runsBracket,
            result_man_of_match: scorecard.manOfMatch,
            result_top_batsman: scorecard.topBatsman.name,
            result_top_batsman_runs: scorecard.topBatsman.runs,
            result_top_bowler: scorecard.topBowler.name,
            result_top_bowler_wickets: scorecard.topBowler.wickets,
            result_fetched_at: new Date().toISOString(),
          }).eq('id', m.id)

          // Auto score all predictions
          await scorePredictions(m.id, scorecard)
          results.push({ matchId: m.id, action: 'scored' })
        }
      }
    }

    // Get playing XI for upcoming matches (1.5 hours before)
    if (m.status === 'upcoming') {
      const minsToStart = (matchTime.getTime() - now.getTime()) / (1000 * 60)
      if (minsToStart < 90 && minsToStart > 0) {
        const xi = await getPlayingXI(
          m.ext_rapidapi_id!,
          m.ext_cricketdata_id || undefined,
          m.ext_entity_id || undefined
        )
        if (xi?.homeTeam.length) {
          await adminSupabase.from('matches').update({
            home_playing_xi: xi.homeTeam.map(p => p.name),
            away_playing_xi: xi.awayTeam.map(p => p.name),
            toss_winner: xi.tossWinner,
            toss_decision: xi.tossDecision,
            status: 'live',
          }).eq('id', m.id)
          results.push({ matchId: m.id, action: 'xi_fetched' })
        }
      }
    }
  }

  return Response.json({ processed: results.length, results })
}
