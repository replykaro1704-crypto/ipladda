export const TEAMS = {
  RCB:  { name: 'Royal Challengers Bengaluru', short: 'RCB',  primary: '#D11F2F', secondary: '#F5A623', textColor: '#FFFFFF' },
  MI:   { name: 'Mumbai Indians',               short: 'MI',   primary: '#005DA0', secondary: '#D4AF37', textColor: '#FFFFFF' },
  CSK:  { name: 'Chennai Super Kings',          short: 'CSK',  primary: '#F5C300', secondary: '#1A3A5C', textColor: '#1A3A5C' },
  KKR:  { name: 'Kolkata Knight Riders',        short: 'KKR',  primary: '#3A1F6E', secondary: '#F5C842', textColor: '#F5C842' },
  SRH:  { name: 'Sunrisers Hyderabad',          short: 'SRH',  primary: '#E8590A', secondary: '#2B2B2B', textColor: '#FFFFFF' },
  DC:   { name: 'Delhi Capitals',               short: 'DC',   primary: '#0057A0', secondary: '#EF1C25', textColor: '#FFFFFF' },
  RR:   { name: 'Rajasthan Royals',             short: 'RR',   primary: '#E91E8C', secondary: '#0057A0', textColor: '#FFFFFF' },
  GT:   { name: 'Gujarat Titans',               short: 'GT',   primary: '#1C2B5E', secondary: '#B5975A', textColor: '#B5975A' },
  PBKS: { name: 'Punjab Kings',                 short: 'PBKS', primary: '#ED1B24', secondary: '#BBBDC1', textColor: '#FFFFFF' },
  LSG:  { name: 'Lucknow Super Giants',         short: 'LSG',  primary: '#A4D65E', secondary: '#1E2D6B', textColor: '#1E2D6B' },
} as const

export type TeamCode = keyof typeof TEAMS

export function getTeamColors(code: string) {
  return TEAMS[code as TeamCode] ?? TEAMS.MI
}

export const TEAM_CODES = Object.keys(TEAMS) as TeamCode[]

export const RUNS_BRACKETS = ['140-160', '161-180', '181-200', '200+'] as const
export type RunsBracket = typeof RUNS_BRACKETS[number]
