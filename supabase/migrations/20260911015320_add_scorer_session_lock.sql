-- ==============================================================================
-- Supabase Database Migration: Add active scorer session lock to matches table
-- Migration Name: add_scorer_session_lock
-- Description: Menambahkan kolom active_scorer_session_id dan active_scorer_claimed_at
--              untuk mekanisme concurrency lock sederhana pada sesi scoring wasit.
-- ==============================================================================

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS active_scorer_session_id TEXT,
    ADD COLUMN IF NOT EXISTS active_scorer_claimed_at TIMESTAMPTZ;

-- Index untuk mempercepat pengecekan session match
CREATE INDEX IF NOT EXISTS idx_matches_active_scorer_session
    ON public.matches (active_scorer_session_id, active_scorer_claimed_at);

COMMENT ON COLUMN public.matches.active_scorer_session_id IS 'UUID session browser wasit yang sedang aktif menginput skor';
COMMENT ON COLUMN public.matches.active_scorer_claimed_at IS 'Timestamp sesi scoring diklaim atau terakhir diperbarui (otomatis kedaluwarsa setelah 5 menit)';
