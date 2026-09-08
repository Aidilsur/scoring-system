-- ==============================================================================
-- Supabase Database Migration: Initial Schema
-- Project: Padel Tournament Scoring System
-- Source of Truth: docs/PROJECT_RULES.md (§4.5 & §5)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ENUMS
-- ==============================================================================

-- Tipe partner untuk kategori turnamen (Fix Partner vs Mix Partner)
CREATE TYPE partner_type AS ENUM (
    'fix',
    'mix'
);

-- Tingkatan skill level untuk kategori turnamen
CREATE TYPE category_level AS ENUM (
    'beginner',
    'lower_bronze',
    'bronze'
);

-- Status pendaftaran tim
CREATE TYPE team_status AS ENUM (
    'pending',
    'confirmed',
    'rejected'
);

-- Status turnamen secara keseluruhan
CREATE TYPE tournament_status AS ENUM (
    'draft',
    'draw_done',
    'ongoing',
    'completed'
);

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
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Fungsi trigger untuk meng-update field updated_at secara otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLES DEFINITION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: categories
-- Menyimpan daftar kategori turnamen yang dibuka (misal Fix Partner - Bronze)
-- ------------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    partner_type partner_type NOT NULL,
    level category_level NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE categories IS 'Kategori kelas turnamen yang dinamis (kombinasi tipe partner dan level)';

-- ------------------------------------------------------------------------------
-- Table: tournament_settings
-- Konfigurasi global turnamen (aturan golden point, ukuran grup, jumlah court, dll)
-- ------------------------------------------------------------------------------
CREATE TABLE tournament_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    team_per_group INT NOT NULL DEFAULT 4,
    golden_point_enabled BOOLEAN NOT NULL DEFAULT true,
    third_place_enabled BOOLEAN NOT NULL DEFAULT false,
    number_of_courts INT NOT NULL DEFAULT 1,
    status tournament_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tournament_settings IS 'Pengaturan global turnamen seperti ukuran grup, opsi third place, dan golden point';

CREATE TRIGGER trigger_update_tournament_settings_updated_at
    BEFORE UPDATE ON tournament_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- Table: courts
-- Lapangan yang digunakan dalam turnamen
-- ------------------------------------------------------------------------------
CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL REFERENCES tournament_settings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE courts IS 'Daftar lapangan (courts) yang diasosiasikan dengan turnamen';

-- ------------------------------------------------------------------------------
-- Table: teams
-- Tim yang mendaftar pada kategori tertentu beserta data pemain dan bukti bayar
-- ------------------------------------------------------------------------------
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    player1_name TEXT NOT NULL,
    player2_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    instagram_handle TEXT,
    reclub_handle TEXT,
    payment_proof_url TEXT,
    status team_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE teams IS 'Data tim peserta turnamen, pendaftaran publik, dan status verifikasi pembayaran';

CREATE TRIGGER trigger_update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
-- 4. INDEXES
-- ==============================================================================

CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_teams_category_id ON teams(category_id);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_courts_tournament_id ON courts(tournament_id);
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
-- 5. STANDINGS SQL VIEW (§4.5 & §5)
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
-- 6. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6.1 Categories RLS
-- Publik boleh membaca, hanya authenticated yang boleh mutasi
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public read access on categories"
    ON categories FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated insert on categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on categories"
    ON categories FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 6.2 Tournament Settings RLS
-- Publik boleh membaca, hanya authenticated yang boleh mutasi
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public read access on tournament_settings"
    ON tournament_settings FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated insert on tournament_settings"
    ON tournament_settings FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on tournament_settings"
    ON tournament_settings FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on tournament_settings"
    ON tournament_settings FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 6.3 Courts RLS
-- Publik boleh membaca, hanya authenticated yang boleh mutasi
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public read access on courts"
    ON courts FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated insert on courts"
    ON courts FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on courts"
    ON courts FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on courts"
    ON courts FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 6.4 Teams RLS
-- Publik boleh membaca
-- Anonymous & Authenticated boleh INSERT (Pendaftaran publik tanpa login)
-- Hanya Authenticated yang boleh UPDATE / DELETE (Admin verifikasi pembayaran)
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public read access on teams"
    ON teams FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public insert on teams for registration"
    ON teams FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update on teams"
    ON teams FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on teams"
    ON teams FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 6.5 Groups RLS
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
-- 6.6 Group Teams RLS
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
-- 6.7 Matches RLS
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
-- 7. REALTIME PUBLICATION
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
