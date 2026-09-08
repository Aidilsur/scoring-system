-- ==============================================================================
-- Supabase Database Migration: Create Groups and Matches Tables
-- Project: Padel Tournament Scoring System
-- Source of Truth: docs/database-schema.md & docs/business-rules.md (§4.3 - §4.5)
-- ==============================================================================

-- ==============================================================================
-- 1. ENUMS
-- ==============================================================================

-- Babak pertandingan
CREATE TYPE match_round AS ENUM (
    'group',
    'semifinal',
    'final',
    'third_place'
);

-- Status pertandingan
CREATE TYPE match_status AS ENUM (
    'scheduled',
    'live',
    'completed',
    'walkover'
);

-- ==============================================================================
-- 2. TABLES DEFINITION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: groups
-- Grup hasil drawing per kategori (misal: Group A, Group B)
-- ------------------------------------------------------------------------------
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE groups IS 'Grup babak penyisihan (round-robin) per kategori';

-- ------------------------------------------------------------------------------
-- Table: group_teams
-- Relasi many-to-many / assignment tim ke dalam grup
-- ------------------------------------------------------------------------------
CREATE TABLE group_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT group_teams_unique_team_per_group UNIQUE (group_id, team_id)
);

COMMENT ON TABLE group_teams IS 'Penempatan tim ke dalam grup tertentu setelah proses drawing';

-- ------------------------------------------------------------------------------
-- Table: matches
-- Jadwal dan rekaman skor pertandingan turnamen (grup & knockout)
-- ------------------------------------------------------------------------------
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    round match_round NOT NULL,
    team_a_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    team_b_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    status match_status NOT NULL DEFAULT 'scheduled',
    winner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    games_team_a INT NOT NULL DEFAULT 0,
    games_team_b INT NOT NULL DEFAULT 0,
    current_point_a TEXT NOT NULL DEFAULT '0',
    current_point_b TEXT NOT NULL DEFAULT '0',
    scheduled_time TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT matches_teams_distinct CHECK (team_a_id <> team_b_id)
);

COMMENT ON TABLE matches IS 'Jadwal, status live scoring, dan hasil akhir pertandingan';

CREATE TRIGGER trigger_update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 3. INDEXES
-- ==============================================================================

CREATE INDEX idx_groups_category_id ON groups(category_id);
CREATE INDEX idx_group_teams_group_id ON group_teams(group_id);
CREATE INDEX idx_group_teams_team_id ON group_teams(team_id);
CREATE INDEX idx_matches_category_id ON matches(category_id);
CREATE INDEX idx_matches_group_id ON matches(group_id);
CREATE INDEX idx_matches_court_id ON matches(court_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_round ON matches(round);
CREATE INDEX idx_matches_team_a_id ON matches(team_a_id);
CREATE INDEX idx_matches_team_b_id ON matches(team_b_id);

-- ==============================================================================
-- 4. STANDINGS SQL VIEW (§4.5 & §5)
-- Dihitung otomatis dari matches completed (Round Robin grup):
-- Menang = 3 poin, Draw (WO ganda) = 1 poin, Kalah = 0 poin
-- ==============================================================================

CREATE OR REPLACE VIEW standings AS
WITH team_group_matches AS (
    -- Perspektif Tim A
    SELECT
        m.group_id,
        m.team_a_id AS team_id,
        m.games_team_a AS games_won,
        m.games_team_b AS games_lost,
        CASE
            WHEN m.winner_team_id = m.team_a_id THEN 1
            ELSE 0
        END AS is_win,
        CASE
            WHEN m.winner_team_id IS NULL THEN 1
            ELSE 0
        END AS is_draw,
        CASE
            WHEN m.winner_team_id IS NOT NULL AND m.winner_team_id <> m.team_a_id THEN 1
            ELSE 0
        END AS is_loss
    FROM matches m
    WHERE m.status = 'completed'
      AND m.round = 'group'
      AND m.group_id IS NOT NULL

    UNION ALL

    -- Perspektif Tim B
    SELECT
        m.group_id,
        m.team_b_id AS team_id,
        m.games_team_b AS games_won,
        m.games_team_a AS games_lost,
        CASE
            WHEN m.winner_team_id = m.team_b_id THEN 1
            ELSE 0
        END AS is_win,
        CASE
            WHEN m.winner_team_id IS NULL THEN 1
            ELSE 0
        END AS is_draw,
        CASE
            WHEN m.winner_team_id IS NOT NULL AND m.winner_team_id <> m.team_b_id THEN 1
            ELSE 0
        END AS is_loss
    FROM matches m
    WHERE m.status = 'completed'
      AND m.round = 'group'
      AND m.group_id IS NOT NULL
),
aggregated_matches AS (
    SELECT
        group_id,
        team_id,
        COUNT(*)::INT AS played,
        SUM(is_win)::INT AS won,
        SUM(is_draw)::INT AS drawn,
        SUM(is_loss)::INT AS lost,
        SUM(games_won)::INT AS games_for,
        SUM(games_lost)::INT AS games_against,
        (SUM(games_won) - SUM(games_lost))::INT AS game_diff,
        (SUM(is_win) * 3 + SUM(is_draw) * 1)::INT AS points
    FROM team_group_matches
    GROUP BY group_id, team_id
)
SELECT
    gt.group_id,
    gt.team_id,
    COALESCE(am.played, 0)::INT AS played,
    COALESCE(am.won, 0)::INT AS won,
    COALESCE(am.drawn, 0)::INT AS drawn,
    COALESCE(am.lost, 0)::INT AS lost,
    COALESCE(am.games_for, 0)::INT AS games_for,
    COALESCE(am.games_against, 0)::INT AS games_against,
    COALESCE(am.game_diff, 0)::INT AS game_diff,
    COALESCE(am.points, 0)::INT AS points
FROM group_teams gt
LEFT JOIN aggregated_matches am
    ON gt.group_id = am.group_id AND gt.team_id = am.team_id;

COMMENT ON VIEW standings IS 'Klasemen grup terkomputasi otomatis dari pertandingan status completed dengan aturan poin §4.5';

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Aktifkan RLS pada seluruh tabel baru
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5.1 Groups RLS
-- Publik boleh membaca, hanya authenticated yang boleh mutasi
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public read access on groups"
    ON groups FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated insert on groups"
    ON groups FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on groups"
    ON groups FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on groups"
    ON groups FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 5.2 Group Teams RLS
-- Publik boleh membaca, hanya authenticated yang boleh mutasi
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public read access on group_teams"
    ON group_teams FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated insert on group_teams"
    ON group_teams FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on group_teams"
    ON group_teams FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on group_teams"
    ON group_teams FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 5.3 Matches RLS
-- Publik boleh membaca (Live score TV & display penonton), mutasi hanya authenticated
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public read access on matches"
    ON matches FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated insert on matches"
    ON matches FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on matches"
    ON matches FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on matches"
    ON matches FOR DELETE
    TO authenticated
    USING (true);

-- ==============================================================================
-- 6. REALTIME PUBLICATION
-- Daftarkan tabel matches ke publikasi realtime Supabase
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE matches;
    END IF;
END $$;
