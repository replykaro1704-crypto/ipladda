// src/lib/cricket-api-complete.ts
// Complete integration of CricketData.org + RapidAPI Cricbuzz + EntitySport

const KEYS = {
  cricketdata: process.env.CRICKETDATA_API_KEY!,
  rapidapi: process.env.RAPIDAPI_KEY!,
  entity: process.env.ENTITY_SPORT_TOKEN!,
}

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface NormalizedMatch {
  externalId: string
  provider: 'cricketdata' | 'rapidapi' | 'entity'
  matchNumber: number
  seriesName: string
  teamHome: { name: string; short: string; id: string }
  teamAway: { name: string; short: string; id: string }
  venue: string
  city: string
  startTime: Date
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  statusText: string
  homeScore?: string   // "174/6 (20.0)"
  awayScore?: string
}

export interface NormalizedScorecard {
  externalId: string
  winner: string          // short code e.g. "RCB"
  winnerFull: string
  winMarginText: string   // "RCB won by 6 wickets"
  tossWinner: string
  tossDecision: 'bat' | 'field'
  manOfMatch: string
  innings: NormalizedInnings[]
  // Computed for IPL Adda
  highestTotal: number
  runsBracket: '140-160' | '161-180' | '181-200' | '200+'
  topBatsman: { name: string; runs: number; balls: number; fours: number; sixes: number; sr: number }
  topBowler: { name: string; wickets: number; overs: number; runs: number; economy: number }
}

export interface NormalizedInnings {
  number: number
  battingTeam: string
  bowlingTeam: string
  total: number
  wickets: number
  overs: number
  batsmen: BatsmanStat[]
  bowlers: BowlerStat[]
}

export interface BatsmanStat {
  name: string; runs: number; balls: number
  fours: number; sixes: number; strikeRate: number
  dismissal: string; isNotOut: boolean
}

export interface BowlerStat {
  name: string; overs: number; maidens: number
  runs: number; wickets: number; economy: number
}

export interface NormalizedPlayingXI {
  homeTeam: { name: string; role: string; isCaptain: boolean; isWK: boolean }[]
  awayTeam: { name: string; role: string; isCaptain: boolean; isWK: boolean }[]
  tossWinner: string
  tossDecision: 'bat' | 'field'
}

// ─────────────────────────────────────────
// HELPER: RUNS BRACKET
// ─────────────────────────────────────────

export function toRunsBracket(runs: number): '140-160' | '161-180' | '181-200' | '200+' {
  if (runs <= 160) return '140-160'
  if (runs <= 180) return '161-180'
  if (runs <= 200) return '181-200'
  return '200+'
}

// ─────────────────────────────────────────
// API FETCHERS (raw)
// ─────────────────────────────────────────

async function fetchCricketData(path: string, params: Record<string, string> = {}) {
  const url = new URL(`https://api.cricapi.com/v1/${path}`)
  url.searchParams.set('apikey', KEYS.cricketdata)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const r = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!r.ok) throw new Error(`CricketData ${r.status}`)
  const d = await r.json()
  if (d.status !== 'success') throw new Error(`CricketData: ${d.reason || 'error'}`)
  return d.data
}

async function fetchRapidAPI(path: string, params: Record<string, string> = {}) {
  const url = new URL(`https://cricbuzz-cricket.p.rapidapi.com${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const r = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-key': KEYS.rapidapi,
      'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    next: { revalidate: 30 }
  })
  if (!r.ok) throw new Error(`RapidAPI ${r.status}`)
  return r.json()
}

async function fetchEntity(path: string, params: Record<string, string> = {}) {
  const url = new URL(`https://restapi.entitysport.com/v2${path}`)
  url.searchParams.set('token', KEYS.entity)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const r = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!r.ok) throw new Error(`EntitySport ${r.status}`)
  const d = await r.json()
  if (d.status !== 'ok') throw new Error(`EntitySport: ${d.status}`)
  return d.response
}

// ─────────────────────────────────────────
// NORMALIZERS
// ─────────────────────────────────────────

// CricketData → Normalized
function normalizeCricketDataMatches(data: any): NormalizedMatch[] {
  return (data?.matchList || []).map((m: any) => ({
    externalId: m.id,
    provider: 'cricketdata' as const,
    matchNumber: parseInt(m.name?.match(/\d+/)?.[0] || '0'),
    seriesName: m.seriesName || '',
    teamHome: { name: m.teamInfo?.[0]?.name || '', short: m.teams?.[0] || '', id: '' },
    teamAway: { name: m.teamInfo?.[1]?.name || '', short: m.teams?.[1] || '', id: '' },
    venue: m.venue || 'Venue TBD',
    city: '',
    startTime: new Date(m.dateTimeGMT),
    status: m.matchEnded ? 'completed' : m.matchStarted ? 'live' : 'upcoming',
    statusText: m.status || '',
    homeScore: m.score?.[0] ? `${m.score[0].r}/${m.score[0].w} (${m.score[0].o})` : undefined,
    awayScore: m.score?.[1] ? `${m.score[1].r}/${m.score[1].w} (${m.score[1].o})` : undefined,
  }))
}

// RapidAPI → Normalized  
function normalizeRapidAPIMatches(data: any): NormalizedMatch[] {
  const matches: NormalizedMatch[] = []
  const typeMatches = data?.typeMatches || []
  for (const tm of typeMatches) {
    for (const sm of tm.seriesMatches || []) {
      const wrapper = sm.seriesAdWrapper
      if (!wrapper) continue
      for (const m of wrapper.matches || []) {
        const info = m.matchInfo
        const score = m.matchScore
        if (!info) continue
        matches.push({
          externalId: info.matchId?.toString(),
          provider: 'rapidapi' as const,
          matchNumber: parseInt(info.matchDesc?.match(/\d+/)?.[0] || '0'),
          seriesName: info.seriesName || wrapper.seriesName || '',
          teamHome: {
            name: info.team1?.teamName || '',
            short: info.team1?.teamSName || '',
            id: info.team1?.teamId?.toString() || ''
          },
          teamAway: {
            name: info.team2?.teamName || '',
            short: info.team2?.teamSName || '',
            id: info.team2?.teamId?.toString() || ''
          },
          venue: info.venueName || '',
          city: info.city || '',
          startTime: new Date(parseInt(info.startDate || '0')),
          status: info.state === 'Complete' ? 'completed'
                : info.state === 'In Progress' ? 'live' : 'upcoming',
          statusText: info.status || '',
          homeScore: score?.team1Score?.inngs1
            ? `${score.team1Score.inngs1.runs}/${score.team1Score.inngs1.wickets} (${score.team1Score.inngs1.overs})`
            : undefined,
          awayScore: score?.team2Score?.inngs1
            ? `${score.team2Score.inngs1.runs}/${score.team2Score.inngs1.wickets} (${score.team2Score.inngs1.overs})`
            : undefined,
        })
      }
    }
  }
  return matches
}

// RapidAPI hscard → NormalizedScorecard
function normalizeRapidAPIScorecard(data: any, matchId: string): NormalizedScorecard {
  // Support both camelCase (live) and all-lowercase (completed) keys from RapidAPI
  const header = data.matchHeader || {}
  const scoreCard = data.scorecard || data.scoreCard || []
  const isComplete = data.ismatchcomplete || header.complete || false
  const statusLine = data.status || header.status || ''

  const innings: NormalizedInnings[] = scoreCard.map((inn: any) => {
    const batDetails = inn.batTeamDetails || inn.batteamdetails || {}
    const bowlDetails = inn.bowlTeamDetails || inn.bowlteamdetails || {}
    const scoreDetails = inn.scoreDetails || inn.scoredetails || {}

    const batsmen: BatsmanStat[] = Object.values(batDetails.batsmenData || batDetails.batsmendata || {})
      .map((b: any) => ({
        name: b.batName || b.name || '',
        runs: b.runs || 0,
        balls: b.balls || 0,
        fours: b.fours || 0,
        sixes: b.sixes || 0,
        strikeRate: parseFloat(b.strikeRate || b.strkrate || '0'),
        dismissal: b.outDesc || 'not out',
        isNotOut: b.outDesc === 'not out' || !b.outDesc,
      }))

    const bowlers: BowlerStat[] = Object.values(bowlDetails.bowlersData || bowlDetails.bowlersdata || {})
      .map((b: any) => ({
        name: b.bowlName || b.name || '',
        overs: parseFloat(b.overs || '0'),
        maidens: b.maidens || 0,
        runs: b.runs || 0,
        wickets: b.wickets || 0,
        economy: parseFloat(b.economy || '0'),
      }))

    return {
      number: inn.inningsId || inn.inningsid || 0,
      battingTeam: batDetails.batTeamShortName || batDetails.batteamshortname || '',
      bowlingTeam: bowlDetails.bowlTeamShortName || bowlDetails.bowlteamshortname || '',
      total: scoreDetails.runs || 0,
      wickets: scoreDetails.wickets || 0,
      overs: parseFloat(scoreDetails.overs || '0'),
      batsmen,
      bowlers,
    }
  })

  // Find top batsman (most runs)
  const allBatsmen = innings.flatMap(i => i.batsmen)
  const topBatsman = allBatsmen.sort((a, b) => b.runs - a.runs)[0] || { name: '', runs: 0, balls: 0, fours: 0, sixes: 0, sr: 0 }

  // Find top bowler (most wickets, best economy)
  const allBowlers = innings.flatMap(i => i.bowlers)
  const topBowler = allBowlers.sort((a, b) => {
    if (b.wickets !== a.wickets) return b.wickets - a.wickets
    return a.economy - b.economy
  })[0] || { name: '', wickets: 0, overs: 0, runs: 0, economy: 0 }

  const highestTotal = Math.max(...innings.map(i => i.total), 0)
  const winnerShort = header.result?.winningTeam || (statusLine.includes('won') ? statusLine.split(' ')[0] : '')
  const tossDecision = (header.toss?.decision || '').toLowerCase().includes('bat') ? 'bat' : 'field'

  return {
    externalId: matchId,
    winner: winnerShort,
    winnerFull: winnerShort,
    winMarginText: statusLine,
    tossWinner: header.toss?.winner || '',
    tossDecision: tossDecision as any,
    manOfMatch: header.playersOfTheMatch?.[0]?.name || topBatsman.name,
    innings,
    highestTotal,
    runsBracket: toRunsBracket(highestTotal),
    topBatsman: {
      name: topBatsman.name,
      runs: topBatsman.runs,
      balls: topBatsman.balls,
      fours: topBatsman.fours,
      sixes: topBatsman.sixes,
      sr: topBatsman.strikeRate,
    },
    topBowler: {
      name: topBowler.name,
      wickets: topBowler.wickets,
      overs: topBowler.overs,
      runs: topBowler.runs,
      economy: topBowler.economy,
    },
  }
}

// RapidAPI playing11 → NormalizedPlayingXI
function normalizeRapidAPIXI(data: any): NormalizedPlayingXI {
  const squad = data.matchPlayingSquad || {}
  const toss = data.tossResults || {}

  const mapPlayers = (teamPlayers: any) =>
    (teamPlayers?.playingXI || []).map((p: any) => ({
      name: p.name || p.fullName || '',
      role: p.role || 'BAT',
      isCaptain: p.isCaptain || false,
      isWK: p.role === 'WK' || p.isKeeper || false,
    }))

  return {
    homeTeam: mapPlayers(squad.team1Players),
    awayTeam: mapPlayers(squad.team2Players),
    tossWinner: toss.tossWinnerName || '',
    tossDecision: toss.decision?.toLowerCase().includes('bat') ? 'bat' : 'field',
  }
}

// ─────────────────────────────────────────
// PUBLIC API — WITH FALLBACK CHAIN
// ─────────────────────────────────────────

/**
 * Get all IPL 2026 live/recent matches
 * Tries: RapidAPI → CricketData → EntitySport
 */
const IPL_TEAMS = ['RCB', 'MI', 'CSK', 'KKR', 'SRH', 'DC', 'RR', 'GT', 'PBKS', 'LSG', 'KXP', 'KXIP']

export async function getIPLMatches(): Promise<NormalizedMatch[]> {
  const allFound: NormalizedMatch[] = []

  // 1. Try RapidAPI (Live, Recent, Upcoming)
  try {
    const live = await fetchRapidAPI('/matches/v1/live')
    const recent = await fetchRapidAPI('/matches/v1/recent')
    const upcoming = await fetchRapidAPI('/matches/v1/upcoming')
    
    const rapidMatches = [
      ...normalizeRapidAPIMatches(live),
      ...normalizeRapidAPIMatches(recent),
      ...normalizeRapidAPIMatches(upcoming)
    ]
    
    allFound.push(...rapidMatches.filter(m => 
      IPL_TEAMS.includes(m.teamHome.short.toUpperCase()) && 
      IPL_TEAMS.includes(m.teamAway.short.toUpperCase())
    ))
  } catch (e: any) { console.error('RapidAPI discovery failed:', e.message) }

  // 2. Try CricketData (Current Matches)
  try {
    const data = await fetchCricketData('currentMatches')
    const matches = normalizeCricketDataMatches(data)
    allFound.push(...matches.filter(m => 
      IPL_TEAMS.includes(m.teamHome.short.toUpperCase()) && 
      IPL_TEAMS.includes(m.teamAway.short.toUpperCase())
    ))
  } catch (e: any) { console.error('CricketData discovery failed:', e.message) }

  // 3. Try EntitySport (Full Season Schedule)
  try {
    const r = await fetchEntity('/matches/', { 
      date: '2026-03-22_2026-06-01', 
      per_page: '100' 
    })
    const entityMatches = (r.items || []).map((m: any) => ({
      externalId: m.match_id.toString(),
      provider: 'entity' as const,
      matchNumber: m.match_number || 0,
      seriesName: m.competition?.title || 'IPL 2026',
      teamHome: { name: m.teama?.name || '', short: m.teama?.short_name || '', id: m.teama?.team_id || '' },
      teamAway: { name: m.teamb?.name || '', short: m.teamb?.short_name || '', id: m.teamb?.team_id || '' },
      venue: m.venue?.name || 'Stadium',
      city: m.venue?.location || '',
      startTime: new Date(m.date_start),
      status: m.status_str?.toLowerCase().includes('live') ? 'live' : m.status_str?.toLowerCase().includes('completed') ? 'completed' : 'upcoming',
    } as NormalizedMatch))
    
    allFound.push(...entityMatches.filter((m: NormalizedMatch) => 
      IPL_TEAMS.includes(m.teamHome.short.toUpperCase()) && 
      IPL_TEAMS.includes(m.teamAway.short.toUpperCase())
    ))
  } catch (e: any) { console.error('EntitySport season sync failed:', e.message) }

  // Deduplicate by Teams + Time (or Match Number)
  const seen = new Set()
  return allFound.filter((m: NormalizedMatch) => {
    const key = `${m.teamHome.short}_${m.teamAway.short}_${m.startTime.getTime()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

/**
 * Get full scorecard for a completed match
 * Tries: RapidAPI hscard → CricketData scorecard → EntitySport scorecard
 */
export async function getMatchScorecard(
  rapidApiId: string,
  cricketdataId?: string,
  entityId?: string
): Promise<NormalizedScorecard | null> {
  // Try RapidAPI hscard (fastest, most data)
  if (rapidApiId) {
    try {
      const data = await fetchRapidAPI(`/mcenter/v1/${rapidApiId}/hscard`)
      if (data?.matchHeader?.complete || data?.ismatchcomplete) {
        return normalizeRapidAPIScorecard(data, rapidApiId)
      }
    } catch (e) {
      console.warn('RapidAPI hscard failed:', e)
    }
  }

  // Fallback: CricketData scorecard
  if (cricketdataId) {
    try {
      const data = await fetchCricketData('match-scorecard', { id: cricketdataId })
      // Parse CricketData format...
      const scorecard = data?.scorecard || []
      const header = data?.matchHeader || {}
      
      const innings: NormalizedInnings[] = scorecard.map((inn: any) => ({
        number: inn.inningsId,
        battingTeam: inn.batTeamDetails?.batTeamShortName || '',
        bowlingTeam: inn.bowlTeamDetails?.bowlTeamShortName || '',
        total: inn.scoreDetails?.runs || 0,
        wickets: inn.scoreDetails?.wickets || 0,
        overs: parseFloat(inn.scoreDetails?.overs || '0'),
        batsmen: Object.values(inn.batTeamDetails?.batsmenData || {}).map((b: any) => ({
          name: b.batName, runs: b.runs, balls: b.balls,
          fours: b.fours, sixes: b.sixes,
          strikeRate: parseFloat(b.strikeRate || '0'),
          dismissal: b.outDesc, isNotOut: b.outDesc === 'not out',
        })),
        bowlers: Object.values(inn.bowlTeamDetails?.bowlersData || {}).map((b: any) => ({
          name: b.bowlName, overs: b.overs, maidens: b.maidens,
          runs: b.runs, wickets: b.wickets,
          economy: parseFloat(b.economy || '0'),
        })),
      }))

      const allBat = innings.flatMap(i => i.batsmen)
      const topBat = allBat.sort((a, b) => b.runs - a.runs)[0]
      const allBowl = innings.flatMap(i => i.bowlers)
      const topBowl = allBowl.sort((a, b) => b.wickets - a.wickets)[0]
      const highest = Math.max(...innings.map(i => i.total), 0)

      return {
        externalId: cricketdataId,
        winner: header.result?.winningTeam || '',
        winnerFull: header.result?.winningTeam || '',
        winMarginText: header.status || '',
        tossWinner: header.toss?.winner || '',
        tossDecision: header.toss?.decision?.toLowerCase().includes('bat') ? 'bat' : 'field',
        manOfMatch: data.matchHeader?.playersOfTheMatch?.[0]?.name || topBat?.name || '',
        innings,
        highestTotal: highest,
        runsBracket: toRunsBracket(highest),
        topBatsman: { name: topBat?.name || '', runs: topBat?.runs || 0, balls: topBat?.balls || 0, fours: topBat?.fours || 0, sixes: topBat?.sixes || 0, sr: topBat?.strikeRate || 0 },
        topBowler: { name: topBowl?.name || '', wickets: topBowl?.wickets || 0, overs: topBowl?.overs || 0, runs: topBowl?.runs || 0, economy: topBowl?.economy || 0 },
      }
    } catch (e) {
      console.warn('CricketData scorecard failed:', e)
    }
  }

  return null
}

/**
 * Get playing XI after toss
 * Tries: RapidAPI → CricketData squad → EntitySport squads
 */
export async function getPlayingXI(
  rapidApiId: string,
  cricketdataId?: string,
  entityId?: string
): Promise<NormalizedPlayingXI | null> {
  // Try RapidAPI
  if (rapidApiId) {
    try {
      const data = await fetchRapidAPI(`/mcenter/v1/${rapidApiId}/playing11`)
      const xi = normalizeRapidAPIXI(data)
      if (xi.homeTeam.length > 0) return xi
    } catch (e) {
      console.warn('RapidAPI playing11 failed:', e)
    }
  }

  // Fallback: CricketData squad
  if (cricketdataId) {
    try {
      const data = await fetchCricketData('match-squad', { id: cricketdataId })
      const teams = data.teams || []
      return {
        homeTeam: (teams[0]?.players || [])
          .filter((p: any) => p.isPlayingXI)
          .map((p: any) => ({
            name: p.name, role: p.role || 'BAT',
            isCaptain: p.isCaptain || false, isWK: p.isKeeper || false,
          })),
        awayTeam: (teams[1]?.players || [])
          .filter((p: any) => p.isPlayingXI)
          .map((p: any) => ({
            name: p.name, role: p.role || 'BAT',
            isCaptain: p.isCaptain || false, isWK: p.isKeeper || false,
          })),
        tossWinner: data.tossResults?.tossWinnerTeam || '',
        tossDecision: data.tossResults?.decision?.toLowerCase() === 'bat' ? 'bat' : 'field',
      }
    } catch (e) {
      console.warn('CricketData squad failed:', e)
    }
  }

  // EntitySport fallback
  if (entityId) {
    try {
      const data = await fetchEntity(`/matches/${entityId}/squads`)
      const squads = data.squads || []
      return {
        homeTeam: (squads[0]?.playing11 || []).map((p: any) => ({
          name: p.name, role: p.role || 'BAT',
          isCaptain: p.isCaptain || false, isWK: p.isWK || false,
        })),
        awayTeam: (squads[1]?.playing11 || []).map((p: any) => ({
          name: p.name, role: p.role || 'BAT',
          isCaptain: p.isCaptain || false, isWK: p.isWK || false,
        })),
        tossWinner: data.toss?.toss_won || '',
        tossDecision: data.toss?.decision?.includes('bat') ? 'bat' : 'field',
      }
    } catch (e) {
      console.warn('EntitySport squads failed:', e)
    }
  }

  return null
}

/**
 * Get detailed match info
 */
export async function getMatchInfo(cricketdataId: string) {
  try {
    return await fetchCricketData('match_info', { id: cricketdataId })
  } catch (e) {
    console.error('getMatchInfo failed:', e)
    return null
  }
}

/**
 * Get list of series/tournaments
 */
export async function getSeriesList(offset = 0) {
  try {
    return await fetchCricketData('series', { offset: offset.toString() })
  } catch (e) {
    console.error('getSeriesList failed:', e)
    return []
  }
}

/**
 * Get player details
 */
export async function getPlayerInfo(playerId: string) {
  try {
    return await fetchCricketData('players_info', { id: playerId })
  } catch (e) {
    console.error('getPlayerInfo failed:', e)
    return null
  }
}

/**
 * Get live status during match
 */
export async function getLiveScore(rapidApiId: string): Promise<{
  homeScore: string
  awayScore: string
  status: string
  currentBatsmen: string[]
  currentBowler: string
} | null> {
  try {
    const data = await fetchRapidAPI(`/mcenter/v1/${rapidApiId}`)
    const liveData = data.miniscore || data.liveScore

    return {
      homeScore: liveData?.batTeam?.teamScore || '',
      awayScore: liveData?.bowlTeam?.teamScore || '',
      status: liveData?.status || data.status || '',
      currentBatsmen: [
        liveData?.batsmanStriker?.batName || '',
        liveData?.batsmanNonStriker?.batName || '',
      ].filter(Boolean),
      currentBowler: liveData?.bowlerStriker?.bowlName || '',
    }
  } catch {
    return null
  }
}
