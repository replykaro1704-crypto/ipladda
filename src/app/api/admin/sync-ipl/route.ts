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

    if (iplMatches.length === 0) {
      return NextResponse.json({ error: 'No IPL matches found from providers' }, { status: 404 })
    }

    // 3. Upsert into Supabase
    let synced = 0
    for (const m of iplMatches) {
      // Determine match number (default to 0 if not found)
      const matchNum = m.matchNumber || 0
      
      // Calculate lock time (30 mins before match starts)
      const lockDate = new Date(m.startTime.getTime() - 30 * 60000)

      // Upsert based on external IDs to prevent doubles
      // We try to match existing records by any of the 3 external IDs
      const { data: existing } = await adminSupabase
        .from('matches')
        .select('id')
        .or(`ext_rapidapi_id.eq.${m.externalId},ext_cricketdata_id.eq.${m.externalId},ext_entity_id.eq.${m.externalId}`)
        .single()

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
        // Assign the ID to the correct provider column
        ...(m.provider === 'rapidapi' ? { ext_rapidapi_id: m.externalId } : {}),
        ...(m.provider === 'cricketdata' ? { ext_cricketdata_id: m.externalId } : {}),
        ...(m.provider === 'entity' ? { ext_entity_id: m.externalId } : {}),
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
