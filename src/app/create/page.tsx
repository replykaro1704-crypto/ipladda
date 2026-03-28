'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Copy, Check, Trophy, ChevronRight } from 'lucide-react'
import { getFingerprint, savePlayerSession } from '@/lib/fingerprint'

const ROOM_SUGGESTIONS = ['MI Wale', 'Office Adda', 'Family Room 2026', 'Colony Boys', 'College Yaar', 'Cricket Lovers']

const AVATARS: Record<string, string> = {
  a:'🦁', b:'🐯', c:'🦊', d:'🐺', e:'🦅', f:'🐉',
  g:'🦋', h:'🐮', i:'🦄', j:'🐼', k:'🦩', l:'🐸',
  m:'🏏', n:'🦖', o:'🐻', p:'🦁', q:'🦊', r:'🐯',
  s:'⚡', t:'🔥', u:'🌟', v:'💫', w:'🎯', x:'🏆',
  y:'🎪', z:'🌈',
}
function getAvatar(name: string) {
  const key = name.trim()[0]?.toLowerCase() ?? 'm'
  return AVATARS[key] ?? '🏏'
}

// ─── Progress Steps ───────────────────────────────────────────
function Steps({ current }: { current: 1 | 2 | 3 }) {
  const labels = ['Room', 'Naam', 'Ready']
  return (
    <div className="flex items-center gap-0">
      {labels.map((l, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={l} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                ${done ? 'bg-[#10B981] text-white' : active ? 'bg-white text-black' : 'bg-[#1A1A1A] text-[#52525B] border border-[#333]'}`}>
                {done ? <Check size={14} /> : n}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${active ? 'text-white' : done ? 'text-[#10B981]' : 'text-[#52525B]'}`}>
                {l}
              </span>
            </div>
            {i < 2 && (
              <div className={`w-8 h-px mb-5 mx-2 transition-colors ${done ? 'bg-[#10B981]' : 'bg-white/20'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Room Name ────────────────────────────────────────
function StepRoomName({ onNext }: { onNext: (name: string) => void }) {
  const [name, setName] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % ROOM_SUGGESTIONS.length), 2200)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight mb-2">Name your room.</h1>
        <p className="text-[#A1A1AA] text-sm">Pick a clean identifier for your group.</p>
      </div>

      <div>
        <div className="relative">
          <input
            ref={inputRef}
            value={name}
            maxLength={30}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim().length >= 2 && onNext(name.trim())}
            placeholder={ROOM_SUGGESTIONS[placeholderIdx]}
            className="w-full bg-[#111] border border-[#333] text-white rounded-xl !text-xl !py-4 px-5 font-display outline-none focus:border-white focus:bg-[#1A1A1A] transition-all placeholder:text-[#52525B]"
          />
          {name.trim().length >= 2 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#10B981]">
              <Check size={20} />
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-[#52525B] mb-4 uppercase tracking-wider font-semibold">Suggestions</p>
        <div className="flex flex-wrap gap-2">
          {ROOM_SUGGESTIONS.map(s => (
            <button key={s} 
              onClick={() => setName(s)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors border
                ${name === s ? 'bg-white text-black border-white' : 'bg-transparent text-[#A1A1AA] border-[#333] hover:border-[#777] hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => name.trim().length >= 2 && onNext(name.trim())}
        disabled={name.trim().length < 2}
        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
          ${name.trim().length >= 2 ? 'bg-white text-black hover:opacity-90' : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'}`}>
        Continue <ChevronRight size={18} />
      </button>
    </motion.div>
  )
}

// ─── Step 2: Admin Name ───────────────────────────────────────
function StepAdminName({ roomName, onNext, onBack }: {
  roomName: string; onNext: (name: string) => void; onBack: () => void
}) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const avatar = name.trim() ? getAvatar(name.trim()) : '🏏'

  return (
    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#111] border border-[#222] rounded-full mb-4 text-xs font-semibold text-[#A1A1AA]">
          <span className="w-1.5 h-1.5 rounded-full bg-white" /> {roomName}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight mb-2">Your identity.</h1>
        <p className="text-[#A1A1AA] text-sm">How should others see you in the room?</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#333] flex items-center justify-center text-3xl">
          {avatar}
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            value={name}
            maxLength={20}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim().length >= 1 && onNext(name.trim())}
            placeholder="Enter your name"
            className="w-full bg-[#111] border border-[#333] text-white rounded-xl !text-xl !py-4 px-4 font-display outline-none focus:border-white focus:bg-[#1A1A1A] transition-all placeholder:text-[#52525B]"
          />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#111] border border-[#222] text-sm text-[#A1A1AA] flex items-start gap-3">
        <Trophy size={18} className="text-white shrink-0 mt-0.5" />
        <p>Your session is tied to this device securely. No passwords required.</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-6 py-4 rounded-xl border border-[#444] text-[#A1A1AA] hover:bg-[#222] hover:text-white hover:border-white transition-colors">
          Back
        </button>
        <button
          onClick={() => name.trim() && onNext(name.trim())}
          disabled={!name.trim()}
          className={`flex-1 py-4 rounded-xl font-semibold transition-all
            ${name.trim() ? 'bg-white text-black hover:opacity-90' : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'}`}>
          Create Room
        </button>
      </div>
    </motion.div>
  )
}

// ─── Step 3: Room Created ─────────────────────────────────────
function StepRoomCreated({ roomCode, roomName, onGoToRoom }: {
  roomCode: string; roomName: string; onGoToRoom: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ipl-adda.vercel.app'

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); onGoToRoom(); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(t)
  }, [onGoToRoom])

  function copyCode() {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center pt-8">
      <div>
        <div className="w-16 h-16 mx-auto bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mb-6">
          <Check size={32} />
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tight mb-2">Room Created</h1>
        <p className="text-[#A1A1AA] text-sm">Your private space is ready.</p>
      </div>

      <div className="clean-card !p-8">
        <p className="text-xs uppercase tracking-widest text-[#52525B] mb-4 font-semibold">Access Code</p>
        <div className="text-5xl font-display tracking-[0.2em] text-white mb-6">
          {roomCode}
        </div>
        <button onClick={copyCode} className="clean-btn-ghost w-full">
          {copied ? <><Check size={16} /> Copied to Clipboard</> : <><Copy size={16} /> Copy Code</>}
        </button>
      </div>

      <button onClick={onGoToRoom} className="clean-btn w-full">
        Enter Room Now <span className="ml-2 bg-black/10 text-black px-2 py-0.5 rounded text-xs">{countdown}s</span>
      </button>
    </motion.div>
  )
}

// ─── Create Page ──────────────────────────────────────────────
export default function CreatePage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [roomName, setRoomName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(adminName: string) {
    setLoading(true); setError('')
    try {
      const fp = getFingerprint()
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName, adminName, fingerprint: fp }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      savePlayerSession(adminName, data.roomCode)
      if (typeof window !== 'undefined') {
        localStorage.setItem('ipl_adda_player_' + data.roomCode, data.playerId)
      }
      setRoomCode(data.roomCode)
      setStep(3)
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 sm:pt-20 px-4">
      <div className="w-full max-w-lg mb-8">
        <button onClick={() => step > 1 ? setStep((step - 1) as 1 | 2) : router.push('/')}
          className="text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-2 mb-8">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="flex items-center justify-between mb-8">
          <div className="font-display font-medium text-xl">IPL ADDA</div>
          <Steps current={step} />
        </div>
      </div>

      <div className="w-full max-w-lg">
        {loading && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-[#333] border-t-white animate-spin" />
            <p className="text-[#A1A1AA] text-sm uppercase tracking-widest">Deploying Room...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="wait">
            {step === 1 && <StepRoomName onNext={n => { setRoomName(n); setStep(2) }} />}
            {step === 2 && <StepAdminName roomName={roomName} onNext={handleCreate} onBack={() => setStep(1)} />}
            {step === 3 && <StepRoomCreated roomCode={roomCode} roomName={roomName} onGoToRoom={() => router.push(`/r/${roomCode}`)} />}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
