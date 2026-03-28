// Generates a stable device fingerprint stored in localStorage.
// This IS the user's identity — no login needed ever.

export function getFingerprint(): string {
  if (typeof window === 'undefined') return ''

  const stored = localStorage.getItem('ipl_adda_fp')
  if (stored) return stored

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 4,
    new Date().getTimezoneOffset(),
  ].join('|')

  let hash = 0
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  const fp = Math.abs(hash).toString(36) + Date.now().toString(36)
  localStorage.setItem('ipl_adda_fp', fp)
  return fp
}

export function getPlayerSession(): { name: string; roomCode: string } | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('ipl_adda_session')
  if (!stored) return null
  try { return JSON.parse(stored) }
  catch { return null }
}

export function savePlayerSession(name: string, roomCode: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('ipl_adda_session', JSON.stringify({ name, roomCode }))
}

export function clearPlayerSession() {
  localStorage.removeItem('ipl_adda_session')
}
