-- ==============================================================================
-- Migration: Add Scheduling Settings to tournament_settings
-- Menambahkan kolom konfigurasi penjadwalan pertandingan:
-- - match_duration_minutes (INT, default 45)
-- - daily_start_time (TIME, default '08:00')
-- - daily_end_time (TIME, default '18:00')
-- ==============================================================================

ALTER TABLE tournament_settings
    ADD COLUMN IF NOT EXISTS match_duration_minutes INT NOT NULL DEFAULT 45,
    ADD COLUMN IF NOT EXISTS daily_start_time TIME NOT NULL DEFAULT '08:00',
    ADD COLUMN IF NOT EXISTS daily_end_time TIME NOT NULL DEFAULT '18:00';

COMMENT ON COLUMN tournament_settings.match_duration_minutes IS 'Estimasi alokasi durasi per match dalam menit untuk penjadwalan';
COMMENT ON COLUMN tournament_settings.daily_start_time IS 'Waktu mulai pertandingan harian turnamen (format HH:mm)';
COMMENT ON COLUMN tournament_settings.daily_end_time IS 'Waktu selesai pertandingan harian turnamen (format HH:mm)';
