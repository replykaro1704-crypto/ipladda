import { getIPLMatches } from '@/lib/cricket-api-complete'

export async function GET() {
  const results: Record<string, any> = {}

  // Test RapidAPI
  try {
    const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
        'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
      }
    })
    results.rapidapi = { status: r.status, ok: r.ok }
  } catch (e: any) { results.rapidapi = { error: e.message } }

  // Test CricketData
  try {
    const r = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${process.env.CRICKETDATA_API_KEY}&offset=0`)
    const d = await r.json()
    results.cricketdata = { 
      status: r.status, 
      ok: r.ok, 
      dataStatus: d.status,
      hitsToday: d.info?.hitsToday,
      hitsLimit: d.info?.hitsLimit
    }
  } catch (e: any) { results.cricketdata = { error: e.message } }

  // Test EntitySport
  try {
    const r = await fetch(`https://restapi.entitysport.com/v2/matches/?token=${process.env.ENTITY_SPORT_TOKEN}&status=1`)
    const d = await r.json()
    results.entity = { status: r.status, ok: r.ok, dataStatus: d.status }
  } catch (e: any) { results.entity = { error: e.message } }

  // Test combined
  const ipl = await getIPLMatches()
  results.iplMatchesFound = ipl.length

  return Response.json(results)
}
