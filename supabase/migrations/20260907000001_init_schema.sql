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

-- ==============================================================================
-- 4. INDEXES
-- ==============================================================================

CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_teams_category_id ON teams(category_id);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_courts_tournament_id ON courts(tournament_id);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5.1 Categories RLS
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
-- 5.2 Tournament Settings RLS
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
-- 5.3 Courts RLS
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
-- 5.4 Teams RLS
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
