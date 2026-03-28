import { create } from 'zustand'

export interface Player {
  id: string
  display_name: string
  fingerprint: string
  total_points: number
  correct_predictions: number
  total_predictions: number
  streak: number
  max_streak: number
  joined_at: string
  last_active: string
}

export interface Room {
  id: string
  code: string
  name: string
  admin_fingerprint: string
  player_count: number
  is_active: boolean
  season: number
}

export interface Match {
  id: string
  match_number: number
  team_home: string
  team_away: string
  team_home_full: string
  team_away_full: string
  venue: string
  city: string
  match_time: string
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  result_winner?: string
  result_total_runs?: number
  result_runs_bracket?: string
  result_man_of_match?: string
  result_runs_home?: number
  result_runs_away?: number
  result_wickets_home?: number
  result_wickets_away?: number
  home_playing_xi?: string[]
  away_playing_xi?: string[]
  lock_time: string
}

export interface Prediction {
  id: string
  player_id: string
  room_id: string
  match_id: string
  predicted_winner?: string
  predicted_runs_bracket?: string
  predicted_top_scorer?: string
  points_earned: number
  winner_correct?: boolean
  runs_correct?: boolean
  scorer_correct?: boolean
  is_locked: boolean
  submitted_at: string
}

interface GameStore {
  currentPlayer: Player | null
  currentRoom: Room | null
  players: Player[]
  matches: Match[]
  predictions: Prediction[]
  isAdmin: boolean
  setPlayer: (p: Player) => void
  setRoom: (r: Room) => void
  setPlayers: (p: Player[]) => void
  setMatches: (m: Match[]) => void
  setPredictions: (p: Prediction[]) => void
  setIsAdmin: (v: boolean) => void
  updatePlayerPoints: (playerId: string, points: number) => void
  upsertPrediction: (pred: Prediction) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  currentPlayer: null,
  currentRoom: null,
  players: [],
  matches: [],
  predictions: [],
  isAdmin: false,

  setPlayer: (p) => set({ currentPlayer: p }),
  setRoom: (r) => set({ currentRoom: r }),
  setPlayers: (p) => set({ players: p }),
  setMatches: (m) => set({ matches: m }),
  setPredictions: (p) => set({ predictions: p }),
  setIsAdmin: (v) => set({ isAdmin: v }),

  updatePlayerPoints: (id, pts) =>
    set((s) => ({
      players: s.players.map((p) =>
        p.id === id ? { ...p, total_points: p.total_points + pts } : p
      ),
    })),

  upsertPrediction: (pred) =>
    set((s) => {
      const exists = s.predictions.findIndex((p) => p.id === pred.id)
      if (exists >= 0) {
        const updated = [...s.predictions]
        updated[exists] = pred
        return { predictions: updated }
      }
      return { predictions: [...s.predictions, pred] }
    }),

  reset: () =>
    set({
      currentPlayer: null,
      currentRoom: null,
      players: [],
      matches: [],
      predictions: [],
      isAdmin: false,
    }),
}))
