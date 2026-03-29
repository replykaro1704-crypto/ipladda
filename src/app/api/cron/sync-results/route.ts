import { getMatchScorecard, getPlayingXI, getLiveScore, getMatchInfo } from '@/lib/cricket-api-complete'
import { adminSupabase } from '@/lib/supabase/admin'
import { scorePredictions } from '@/lib/cricket-sync'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const querySecret = searchParams.get('secret')
  const authHeader = req.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || (authHeader !== `Bearer ${cronSecret}` && querySecret !== cronSecret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get matches that need syncing (any live/upcoming matches)
  const { data: matches } = await adminSupabase
    .from('matches')
    .select('id, team_home, team_away, ext_rapidapi_id, ext_cricketdata_id, ext_entity_id, status, match_time')
    .or('status.eq.live,status.eq.upcoming')

  const results = []

  for (const m of matches || []) {
    const matchTime = new Date(m.match_time)
    const now = new Date()
    const hoursAgo = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60)

    // 1. Update LIVE SCORES
    if (m.status === 'live') {
      let live = null

      // Try RapidAPI first
      if (m.ext_rapidapi_id) {
        live = await getLiveScore(m.ext_rapidapi_id)
      } 
      // Fallback to CricketData for score string if needed
      else if (m.ext_cricketdata_id) {
        const info = await getMatchInfo(m.ext_cricketdata_id)
        if (info?.score) {
          const s1 = info.score[0] ? `${info.score[0].r}/${info.score[0].w} (${info.score[0].o})` : ''
          const s2 = info.score[1] ? `${info.score[1].r}/${info.score[1].w} (${info.score[1].o})` : ''
          live = { homeScore: s1, awayScore: s2 }
        }
      }

      if (live) {
        await adminSupabase.from('matches').update({
          live_home_score: live.homeScore,
          live_away_score: live.awayScore,
          live_updated_at: new Date().toISOString(),
        }).eq('id', m.id)
      }

      // If match > 3.5 hours old, try to get full result/scorecard
      if (hoursAgo > 3.5) {
        const scorecard = await getMatchScorecard(
          m.ext_rapidapi_id || '',
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

          // Auto score all predictions using the scoring engine
          await scorePredictions(m.id, scorecard)
          results.push({ matchId: m.id, teams: `${m.team_home} vs ${m.team_away}`, action: 'scored' })
        }
      }
    }

    // 2. Get playing XI for upcoming matches (start checking 90 mins before)
    if (m.status === 'upcoming') {
      const minsToStart = (matchTime.getTime() - now.getTime()) / (1000 * 60)
      
      // If match started or about to start within 90 mins
      if (minsToStart < 90) {
        const xi = await getPlayingXI(
          m.ext_rapidapi_id || '',
          m.ext_cricketdata_id || undefined,
          m.ext_entity_id || undefined
        )

        if (xi?.homeTeam.length) {
          await adminSupabase.from('matches').update({
            home_playing_xi: xi.homeTeam.map(p => p.name),
            away_playing_xi: xi.awayTeam.map(p => p.name),
            toss_winner: xi.tossWinner,
            toss_decision: xi.tossDecision,
            status: 'live', // Move from upcoming to live
          }).eq('id', m.id)
          results.push({ matchId: m.id, teams: `${m.team_home} vs ${m.team_away}`, action: 'xi_fetched' })
        }
      }
    }
  }

  return Response.json({ processed: matches?.length || 0, results })
}
