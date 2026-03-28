import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  try {
    // Mark matches as completed if match_time + 4 hours has passed
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()

    const { data: toComplete, error: fetchErr } = await adminSupabase
      .from('matches')
      .select('id, match_number, team_home, team_away')
      .eq('status', 'upcoming')
      .lt('match_time', fourHoursAgo)

    if (fetchErr) throw fetchErr

    let updated = 0
    if (toComplete && toComplete.length > 0) {
      // Update to 'completed' — admin still needs to manually enter result
      // This just changes status from upcoming to live as time progresses
      const { error: updateErr } = await adminSupabase
        .from('matches')
        .update({ status: 'live' })
        .in('id', toComplete.map((m) => m.id))

      if (updateErr) throw updateErr
      updated = toComplete.length
    }

    return NextResponse.json({
      success: true,
      timestamp: now,
      matchesUpdated: updated,
    })
  } catch (e) {
    console.error('Cron error:', e)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
