-- ==============================================================================
-- Supabase Database Migration: Add admin_users table with role management
-- Migration Name: add_admin_users_role
-- ==============================================================================

-- 1. Create table admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'referee')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on email for fast lookups during auth verification
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users (email);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Security Definer Helper Function: prevent recursive RLS evaluation
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE email = (auth.jwt() ->> 'email') AND role = 'admin'
    );
$$;

-- 4. RLS Policies
-- SELECT: Boleh dibaca jika user adalah admin (bisa baca semua), ATAU membaca datanya sendiri (untuk cek role saat login)
CREATE POLICY "Allow authenticated read for self or admin"
    ON public.admin_users FOR SELECT
    TO authenticated
    USING (
        email = (auth.jwt() ->> 'email')
        OR public.is_admin_user()
    );

-- INSERT: Hanya boleh dilakukan oleh user yang terdaftar sebagai admin
CREATE POLICY "Allow admin to insert admin_users"
    ON public.admin_users FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin_user());

-- UPDATE: Hanya boleh dilakukan oleh user yang terdaftar sebagai admin
CREATE POLICY "Allow admin to update admin_users"
    ON public.admin_users FOR UPDATE
    TO authenticated
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

-- DELETE: Hanya boleh dilakukan oleh user yang terdaftar sebagai admin
CREATE POLICY "Allow admin to delete admin_users"
    ON public.admin_users FOR DELETE
    TO authenticated
    USING (public.is_admin_user());
