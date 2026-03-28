import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiter (per-process, not distributed)
// For production with multiple instances, use Upstash Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false

  entry.count++
  return true
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = getIp(req)

  // Rate limit prediction submissions: 10 per minute per IP
  if (pathname === '/api/predictions/submit') {
    const key = `predict:${ip}`
    if (!rateLimit(key, 10, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  // Rate limit room creation: 5 per hour per IP
  if (pathname === '/api/rooms/create') {
    const key = `room-create:${ip}`
    if (!rateLimit(key, 5, 60 * 60_000)) {
      return NextResponse.json({ error: 'Too many rooms created' }, { status: 429 })
    }
  }

  // Rate limit scoring: 20 per hour per IP
  if (pathname === '/api/matches/score') {
    const key = `score:${ip}`
    if (!rateLimit(key, 20, 60 * 60_000)) {
      return NextResponse.json({ error: 'Too many scoring requests' }, { status: 429 })
    }
  }

  // Security headers for all responses
  const res = NextResponse.next()
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return res
}

export const config = {
  matcher: [
    '/api/predictions/submit',
    '/api/rooms/create',
    '/api/matches/score',
  ],
}
