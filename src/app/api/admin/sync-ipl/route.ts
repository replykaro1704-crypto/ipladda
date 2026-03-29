import { NextRequest, NextResponse } from 'next/server'
import { getIPLMatches } from '@/lib/cricket-api-complete'
import { adminSupabase } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { adminFingerprint } = await req.json()

    // 1. Verify admin status (must be admin of at least one room)
    const { data: rooms, error: roomError } = await adminSupabase
      .from('rooms')
      .select('id')
      .eq('admin_fingerprint', adminFingerprint)
      .limit(1)

    if (!rooms || rooms.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 2. Fetch matches from all 3 APIs (with 5-min caching)
    const iplMatches = await getIPLMatches()

    if (!iplMatches || iplMatches.length === 0) {
      return NextResponse.json({ error: 'No IPL matches found from providers' }, { status: 404 })
    }

    // 2.5 Fresh Wipe (User requested: Delete all first to clear 2023 leftovers)
    await adminSupabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 3. Upsert into Supabase (Use sorted index as Match #)
    let synced = 0
    for (let i = 0; i < iplMatches.length; i++) {
      const m = iplMatches[i]
      const matchNum = i + 1 // Perfect Chronological Numbering
      
      // Calculate lock time (30 mins before match starts)
      const lockDate = new Date(m.startTime.getTime() - 30 * 60000)
      
      const idColumn = m.provider === 'rapidapi' ? 'ext_rapidapi_id' 
                     : m.provider === 'cricketdata' ? 'ext_cricketdata_id' 
                     : 'ext_entity_id'

      const { data: existing } = await adminSupabase
        .from('matches')
        .select('id')
        .or(`${idColumn}.eq.${m.externalId},and(team_home.eq.${m.teamHome.short},team_away.eq.${m.teamAway.short},match_time.eq.${m.startTime.toISOString()})`)
        .maybeSingle()

      const matchData = {
        team_home: m.teamHome.short,
        team_away: m.teamAway.short,
        team_home_full: m.teamHome.name,
        team_away_full: m.teamAway.name,
        venue: m.venue,
        city: m.city,
        match_time: m.startTime.toISOString(),
        lock_time: lockDate.toISOString(),
        status: m.status,
        match_number: matchNum,
        ext_rapidapi_id: m.provider === 'rapidapi' ? m.externalId : null,
        ext_cricketdata_id: m.provider === 'cricketdata' ? m.externalId : null,
        ext_entity_id: m.provider === 'entity' ? m.externalId : null,
      }

      if (existing) {
        await adminSupabase.from('matches').update(matchData).eq('id', existing.id)
      } else {
        await adminSupabase.from('matches').insert(matchData)
      }
      synced++
    }

    return NextResponse.json({ 
      success: true, 
      count: synced,
      message: `${synced} matches synced from ${iplMatches[0].provider}`
    })

  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
