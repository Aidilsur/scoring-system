-- ==============================================================================
-- Supabase Database Migration: Create Payment Proofs Storage Bucket & Policies
-- Project: Padel Tournament Scoring System
-- Source of Truth: docs/PROJECT_RULES.md (§2 & §4.2)
-- ==============================================================================

-- 1. Create 'payment-proofs' storage bucket (Private bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'payment-proofs',
    'payment-proofs',
    false,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- 2. Storage RLS Policies for 'payment-proofs' bucket

-- Izinkan publik (termasuk anon) untuk mengunggah bukti pembayaran pendaftaran
CREATE POLICY "Allow public upload payment proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

-- Hanya admin (authenticated) yang boleh melihat/mendownload bukti pembayaran
CREATE POLICY "Allow authenticated read payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Hanya admin (authenticated) yang boleh mengelola/menghapus file bukti pembayaran
CREATE POLICY "Allow authenticated update payment proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-proofs')
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Allow authenticated delete payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs');
