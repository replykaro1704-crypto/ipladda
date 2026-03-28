-- ================================================================
-- IPL ADDA 2026 — Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLES
-- ================================================================

-- ROOMS: each prediction group
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name VARCHAR(60) NOT NULL,
  admin_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  season INTEGER DEFAULT 2026,
  total_matches INTEGER DEFAULT 0,
  player_count INTEGER DEFAULT 0
);

-- PLAYERS: anonymous users identified by fingerprint + room
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  display_name VARCHAR(30) NOT NULL,
  fingerprint TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, fingerprint)
);

-- MATCHES: IPL 2026 schedule
-- lock_time = match_time - 30 minutes (auto-set by trigger below)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_number INTEGER NOT NULL,
  team_home VARCHAR(10) NOT NULL,
  team_away VARCHAR(10) NOT NULL,
  team_home_full VARCHAR(40),
  team_away_full VARCHAR(40),
  venue VARCHAR(80),
  city VARCHAR(40),
  match_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming',
  result_winner VARCHAR(10),
  result_runs_home INTEGER,
  result_runs_away INTEGER,
  result_wickets_home INTEGER,
  result_wickets_away INTEGER,
  result_man_of_match VARCHAR(50),
  result_total_runs INTEGER,
  result_runs_bracket VARCHAR(20),
  home_playing_xi TEXT[],
  away_playing_xi TEXT[],
  lock_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-set lock_time = match_time - 30 min on insert/update
CREATE OR REPLACE FUNCTION set_lock_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lock_time := NEW.match_time - INTERVAL '30 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_lock_time
  BEFORE INSERT OR UPDATE OF match_time ON matches
  FOR EACH ROW EXECUTE FUNCTION set_lock_time();

-- PREDICTIONS
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner VARCHAR(10),
  predicted_runs_bracket VARCHAR(20),
  predicted_top_scorer VARCHAR(50),
  points_earned INTEGER DEFAULT 0,
  winner_correct BOOLEAN,
  runs_correct BOOLEAN,
  scorer_correct BOOLEAN,
  is_locked BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  scored_at TIMESTAMPTZ,
  UNIQUE(player_id, match_id)
);

-- SEASON PREDICTIONS (one-time per season)
CREATE TABLE season_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  predicted_champion VARCHAR(10),
  predicted_orange_cap VARCHAR(50),
  predicted_purple_cap VARCHAR(50),
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, room_id)
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_predictions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for MVP (tighten later)
CREATE POLICY "rooms_public_read"    ON rooms FOR SELECT USING (true);
CREATE POLICY "rooms_insert"         ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "rooms_update_admin"   ON rooms FOR UPDATE USING (true);

CREATE POLICY "players_public_read"  ON players FOR SELECT USING (true);
CREATE POLICY "players_insert"       ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update"       ON players FOR UPDATE USING (true);

CREATE POLICY "matches_public_read"  ON matches FOR SELECT USING (true);
CREATE POLICY "matches_service_write" ON matches FOR ALL USING (true);

CREATE POLICY "predictions_public_read" ON predictions FOR SELECT USING (true);
CREATE POLICY "predictions_insert"      ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "predictions_update"      ON predictions FOR UPDATE USING (true);

CREATE POLICY "season_preds_read"   ON season_predictions FOR SELECT USING (true);
CREATE POLICY "season_preds_insert" ON season_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "season_preds_update" ON season_predictions FOR UPDATE USING (true);

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX idx_predictions_player  ON predictions(player_id);
CREATE INDEX idx_predictions_match   ON predictions(match_id);
CREATE INDEX idx_predictions_room    ON predictions(room_id);
CREATE INDEX idx_players_room        ON players(room_id);
CREATE INDEX idx_players_fingerprint ON players(room_id, fingerprint);
CREATE INDEX idx_matches_status      ON matches(status);
CREATE INDEX idx_matches_time        ON matches(match_time);

-- ================================================================
-- REALTIME
-- ================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Generate unique 6-char room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SEED: IPL 2026 Schedule (first 14 matches)
-- lock_time will be auto-set by trigger to match_time - 30 min
-- ================================================================

INSERT INTO matches (match_number, team_home, team_away, team_home_full, team_away_full, venue, city, match_time) VALUES
(1,  'RCB',  'SRH',  'Royal Challengers Bengaluru', 'Sunrisers Hyderabad',         'M Chinnaswamy Stadium',     'Bengaluru',  '2026-03-28 19:30:00+05:30'),
(2,  'CSK',  'MI',   'Chennai Super Kings',          'Mumbai Indians',               'MA Chidambaram Stadium',    'Chennai',    '2026-03-29 19:30:00+05:30'),
(3,  'KKR',  'DC',   'Kolkata Knight Riders',        'Delhi Capitals',               'Eden Gardens',              'Kolkata',    '2026-03-30 19:30:00+05:30'),
(4,  'GT',   'RR',   'Gujarat Titans',               'Rajasthan Royals',             'Narendra Modi Stadium',     'Ahmedabad',  '2026-03-31 19:30:00+05:30'),
(5,  'LSG',  'PBKS', 'Lucknow Super Giants',         'Punjab Kings',                 'Ekana Cricket Stadium',     'Lucknow',    '2026-04-01 19:30:00+05:30'),
(6,  'SRH',  'CSK',  'Sunrisers Hyderabad',          'Chennai Super Kings',          'Rajiv Gandhi Intl Stadium', 'Hyderabad',  '2026-04-02 19:30:00+05:30'),
(7,  'MI',   'RCB',  'Mumbai Indians',               'Royal Challengers Bengaluru',  'Wankhede Stadium',          'Mumbai',     '2026-04-03 19:30:00+05:30'),
(8,  'RR',   'KKR',  'Rajasthan Royals',             'Kolkata Knight Riders',        'Sawai Mansingh Stadium',    'Jaipur',     '2026-04-04 15:30:00+05:30'),
(9,  'DC',   'GT',   'Delhi Capitals',               'Gujarat Titans',               'Arun Jaitley Stadium',      'Delhi',      '2026-04-04 19:30:00+05:30'),
(10, 'PBKS', 'LSG',  'Punjab Kings',                 'Lucknow Super Giants',         'New PCA Stadium',           'Mullanpur',  '2026-04-05 19:30:00+05:30'),
(11, 'CSK',  'RCB',  'Chennai Super Kings',          'Royal Challengers Bengaluru',  'MA Chidambaram Stadium',    'Chennai',    '2026-04-06 19:30:00+05:30'),
(12, 'SRH',  'KKR',  'Sunrisers Hyderabad',          'Kolkata Knight Riders',        'Rajiv Gandhi Intl Stadium', 'Hyderabad',  '2026-04-07 19:30:00+05:30'),
(13, 'MI',   'GT',   'Mumbai Indians',               'Gujarat Titans',               'Wankhede Stadium',          'Mumbai',     '2026-04-08 19:30:00+05:30'),
(14, 'RR',   'DC',   'Rajasthan Royals',             'Delhi Capitals',               'Sawai Mansingh Stadium',    'Jaipur',     '2026-04-09 19:30:00+05:30');
