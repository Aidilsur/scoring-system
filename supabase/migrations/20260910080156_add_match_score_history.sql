-- ==============================================================================
-- Supabase Database Migration: Add match_score_history table
-- Migration Name: add_match_score_history
-- Description: Menyimpan snapshot kondisi match sebelum setiap poin dicatat untuk
--              mendukung fitur undo live scoring.
-- ==============================================================================

-- 1. Create table match_score_history
CREATE TABLE IF NOT EXISTS public.match_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    point_a TEXT NOT NULL,
    point_b TEXT NOT NULL,
    games_team_a INT NOT NULL,
    games_team_b INT NOT NULL,
    status match_status NOT NULL,
    winner_team_id UUID REFERENCES public.teams(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes
-- Index pada match_id (dan created_at DESC) untuk query cepat saat mengambil snapshot terakhir (undo)
CREATE INDEX IF NOT EXISTS idx_match_score_history_match_id 
    ON public.match_score_history (match_id);

CREATE INDEX IF NOT EXISTS idx_match_score_history_match_created 
    ON public.match_score_history (match_id, created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.match_score_history ENABLE ROW LEVEL SECURITY;

-- 4. Helper function untuk memverifikasi role admin atau referee
CREATE OR REPLACE FUNCTION public.is_scorer_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE email = (auth.jwt() ->> 'email')
          AND role IN ('admin', 'referee')
    );
$$;

-- 5. RLS Policies
-- Hanya authenticated (admin/referee) yang bisa select/insert/delete, TIDAK ada akses public.

-- SELECT: Hanya admin / referee terautentikasi
CREATE POLICY "Allow authenticated scorer to select match_score_history"
    ON public.match_score_history FOR SELECT
    TO authenticated
    USING (public.is_scorer_user());

-- INSERT: Hanya admin / referee terautentikasi
CREATE POLICY "Allow authenticated scorer to insert match_score_history"
    ON public.match_score_history FOR INSERT
    TO authenticated
    WITH CHECK (public.is_scorer_user());

-- DELETE: Hanya admin / referee terautentikasi (untuk menghapus snapshot saat undo)
CREATE POLICY "Allow authenticated scorer to delete match_score_history"
    ON public.match_score_history FOR DELETE
    TO authenticated
    USING (public.is_scorer_user());
