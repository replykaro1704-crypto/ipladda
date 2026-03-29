import { NextRequest, NextResponse } from 'next/server'
import { getIPLMatches, getMatchScorecard, getLiveScore, getPlayingXI } from '@/lib/cricket-api-complete'

export async function GET(req: NextRequest) {
  const diagnostic: any = {
    timestamp: new Date().toISOString(),
    env: {
      has_cricketdata: !!process.env.CRICKETDATA_API_KEY,
      has_rapidapi: !!process.env.RAPIDAPI_KEY,
      has_entity: !!process.env.ENTITY_SPORT_TOKEN,
    },
    results: {}
  }

  try {
    // 1. Test Match Discovery
    console.log('[test-full] Fetching IPL Match schedule...')
    const matches = await getIPLMatches()
    diagnostic.results.discovery = {
      count: matches.length,
      provider: matches[0]?.provider || 'none',
      firstMatch: matches[0] ? `${matches[0].teamHome.short} vs ${matches[0].teamAway.short}` : 'none'
    }

    if (matches.length > 0) {
      const target = matches[0]
      const id = target.externalId

      // 2. Test Live Score (on the first match found)
      console.log(`[test-full] Testing Live Score for ${id}...`)
      try {
        const live = await getLiveScore(id)
        diagnostic.results.liveScore = live || 'no live data'
      } catch (e: any) {
        diagnostic.results.liveScore = { error: e.message }
      }

      // 3. Test Playing XI
      console.log(`[test-full] Testing Playing XI for ${id}...`)
      try {
        const xi = await getPlayingXI(id)
        diagnostic.results.playingXI = xi ? {
          found: true,
          homeTeamCount: xi.homeTeam.length,
          toss: xi.tossWinner ? `${xi.tossWinner} chose to ${xi.tossDecision}` : 'no toss'
        } : 'not available'
      } catch (e: any) {
        diagnostic.results.playingXI = { error: e.message }
      }

      // 4. Test Scorecard/Result
      console.log(`[test-full] Testing Scorecard for ${id}...`)
      try {
        const scorecard = await getMatchScorecard(id)
        diagnostic.results.scorecard = scorecard ? {
          winner: scorecard.winner,
          highestTotal: scorecard.highestTotal,
          bracket: scorecard.runsBracket,
          mom: scorecard.manOfMatch
        } : 'not completed'
      } catch (e: any) {
        diagnostic.results.scorecard = { error: e.message }
      }
    }

    return NextResponse.json(diagnostic, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 })
  }
}
