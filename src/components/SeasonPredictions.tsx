'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Trophy, Check } from 'lucide-react'
import { TEAM_CODES } from '@/lib/teams'
import { getTeamColors } from '@/lib/teams'
import { createClient } from '@/lib/supabase/client'

interface SeasonPredictionsProps {
  playerId: string
  roomId: string
}

interface SeasonPred {
  predicted_champion: string
  predicted_orange_cap: string
  predicted_purple_cap: string
}

const POPULAR_BATSMEN = ['Virat Kohli', 'Rohit Sharma', 'KL Rahul', 'Shubman Gill', 'Hardik Pandya', 'Suryakumar Yadav', 'Rishabh Pant', 'Ruturaj Gaikwad', 'Yashasvi Jaiswal', 'David Warner']
const POPULAR_BOWLERS = ['Jasprit Bumrah', 'Mohammed Shami', 'Rashid Khan', 'Yuzvendra Chahal', 'Pat Cummins', 'Mitchell Starc', 'Bhuvneshwar Kumar', 'Trent Boult', 'Arshdeep Singh', 'Harshal Patel']

export default function SeasonPredictions({ playerId, roomId }: SeasonPredictionsProps) {
  const [existing, setExisting] = useState<SeasonPred | null>(null)
  const [champion, setChampion] = useState('')
  const [orangeCap, setOrangeCap] = useState('')
  const [purpleCap, setPurpleCap] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('season_predictions')
      .select('*')
      .eq('player_id', playerId)
      .eq('room_id', roomId)
      .single()
      .then(({ data }) => {
        if (data) {
          setExisting(data as SeasonPred)
          setChampion(data.predicted_champion ?? '')
          setOrangeCap(data.predicted_orange_cap ?? '')
          setPurpleCap(data.predicted_purple_cap ?? '')
        }
        setLoading(false)
      })
  }, [playerId, roomId])

  async function handleSave() {
    if (!champion) { setError('Select an IPL Champion'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase
      .from('season_predictions')
      .upsert({
        player_id: playerId,
        room_id: roomId,
        predicted_champion: champion,
        predicted_orange_cap: orangeCap || null,
        predicted_purple_cap: purpleCap || null,
      }, { onConflict: 'player_id,room_id' })

    setSaving(false)
    if (err) { setError('Save failed. Try again.'); return }
    setSaved(true)
    setExisting({ predicted_champion: champion, predicted_orange_cap: orangeCap, predicted_purple_cap: purpleCap })
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="w-full h-40 rounded-xl bg-[#111] animate-pulse" />

  return (
    <div className="clean-card !p-6 border-[#222]">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="font-display text-2xl font-medium tracking-tight mb-1">Season Bets</h3>
          <p className="font-body text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold">One-time picks for IPL 2026</p>
        </div>
        <div className="text-right">
          <div className="font-body text-[10px] text-[#A1A1AA] uppercase tracking-wider font-semibold">Bonus</div>
          <div className="font-display text-xl font-medium tracking-tight text-[#10B981]">+110pts</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-body text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
              🏆 IPL Champion
            </label>
            <span className="text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded">
              +50 PTS
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {TEAM_CODES.map((code) => {
              const team = getTeamColors(code)
              const active = champion === code
              return (
                <button
                  key={code}
                  onClick={() => setChampion(active ? '' : code)}
                  className={`py-3 rounded-lg font-display text-sm font-medium transition-all focus:outline-none`}
                  style={{
                    background: active ? team.primary : '#1A1A1A',
                    color: active ? team.textColor : '#71717A',
                    border: active ? `1px solid ${team.primary}` : '1px solid #333',
                  }}
                >
                  {code}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-body text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
              🟠 Orange Cap
            </label>
            <span className="text-[10px] font-bold text-[#52525B] uppercase">+30 PTS</span>
          </div>
          <select
            className="clean-input w-full text-sm appearance-none bg-[#1A1A1A] border border-[#333] hover:border-[#555] cursor-pointer"
            value={orangeCap}
            onChange={(e) => setOrangeCap(e.target.value)}
          >
            <option value="">Select Batsman (Optional)</option>
            {POPULAR_BATSMEN.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-body text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
              🟣 Purple Cap
            </label>
            <span className="text-[10px] font-bold text-[#52525B] uppercase">+30 PTS</span>
          </div>
          <select
            className="clean-input w-full text-sm appearance-none bg-[#1A1A1A] border border-[#333] hover:border-[#555] cursor-pointer"
            value={purpleCap}
            onChange={(e) => setPurpleCap(e.target.value)}
          >
            <option value="">Select Bowler (Optional)</option>
            {POPULAR_BOWLERS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {error && <p className="text-[#EF4444] text-xs font-bold bg-[#EF4444]/10 p-2 rounded">{error}</p>}

        <div className="pt-2">
          {existing ? (
            <div className="space-y-3">
              <div className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded-xl p-3 flex items-center justify-center gap-2 text-sm font-semibold">
                <Check size={16} /> Submitted ({existing.predicted_champion})
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full py-3 text-[#A1A1AA] hover:text-white font-semibold transition-colors border border-[#333] hover:border-white rounded-xl bg-transparent">
                {saving ? 'Updating...' : 'Update Season Picks'}
              </button>
            </div>
          ) : (
            <button onClick={handleSave} disabled={saving || !champion} className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-colors
              ${saving || !champion ? 'bg-[#1A1A1A] text-[#52525B] cursor-not-allowed border border-[#333]' : 'bg-white text-black hover:bg-gray-200'}`}>
              {saved ? <><Check size={16} /> Locked!</> :
                saving ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Saving...</> :
                <><Trophy size={16} /> Lock Season Bets</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
