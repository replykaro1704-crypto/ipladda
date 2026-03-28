import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminSupabase } from '@/lib/supabase/admin'

const CreateRoomSchema = z.object({
  name: z.string().min(2).max(60).trim(),
  adminName: z.string().min(1).max(30).trim(),
  fingerprint: z.string().min(4).max(100),
})

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(req: NextRequest) {
  try {
    // Content-type check
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 415 })
    }

    const body = await req.json()
    const parsed = CreateRoomSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, adminName, fingerprint } = parsed.data

    // Rate limit: max 3 rooms per fingerprint per 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await adminSupabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('admin_fingerprint', fingerprint)
      .gte('created_at', since)

    if ((count ?? 0) >= 3) {
      return NextResponse.json({ error: 'Rate limit: max 3 rooms per 24h' }, { status: 429 })
    }

    // Generate unique 6-char code (retry on collision)
    let roomCode = ''
    let attempts = 0
    while (attempts < 5) {
      const candidate = generateCode()
      const { data: existing } = await adminSupabase
        .from('rooms')
        .select('id')
        .eq('code', candidate)
        .single()
      if (!existing) { roomCode = candidate; break }
      attempts++
    }

    if (!roomCode) {
      return NextResponse.json({ error: 'Could not generate unique code' }, { status: 500 })
    }

    // Insert room
    const { data: room, error: roomError } = await adminSupabase
      .from('rooms')
      .insert({ code: roomCode, name, admin_fingerprint: fingerprint })
      .select()
      .single()

    if (roomError || !room) {
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
    }

    // Insert admin as first player
    const { data: player, error: playerError } = await adminSupabase
      .from('players')
      .insert({ room_id: room.id, display_name: adminName, fingerprint })
      .select()
      .single()

    if (playerError || !player) {
      // Rollback room
      await adminSupabase.from('rooms').delete().eq('id', room.id)
      return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
    }

    return NextResponse.json({
      roomCode,
      roomId: room.id,
      playerId: player.id,
      roomName: name,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
