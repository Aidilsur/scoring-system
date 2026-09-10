# Roadmap MVP 2 (Belum Dikerjakan — Catatan untuk Nanti)

> ⚠️ File ini SENGAJA tidak di-reference dari AGENTS.md, supaya agent tidak
> "mikir" soal fitur ini saat mengerjakan MVP 1. Buka manual kalau memang
> sudah waktunya mengerjakan bagian ini.

Ide berikut **sengaja tidak dikerjakan di MVP 1** supaya tidak over-engineer
di awal. Dicatat di sini agar tidak hilang dan gampang dilanjutkan setelah
MVP 1 stabil.

## Multi-Tenant Turnamen + Role-Based Access

- Saat ini sistem diasumsikan **1 turnamen tunggal**, **1 level admin generik** (siapa saja yang login Google = admin penuh).
- Rencana MVP 2: siapa saja bisa **membuat turnamennya sendiri** (multi-tenant), lalu **invite orang lain** dengan role berbeda ke turnamen tersebut (misal: Owner, Organizer, Wasit — wasit kemungkinan hanya bisa akses input skor untuk court yang di-assign ke dia).
- Perubahan yang dibutuhkan saat itu terjadi:
  - Tambah kolom `owner_id` di `tournament_settings`
  - Semua tabel turunan (categories, teams, groups, matches, courts) perlu eksplisit terhubung ke `tournament_id`
  - Tabel baru `tournament_members` (tournament_id, user_id, role)
  - Tabel baru `tournament_invitations` (atau mekanisme link invite) untuk mengundang role tertentu
  - RLS policy perlu dirombak total mengikuti role & kepemilikan turnamen, bukan lagi "asal login = admin"
- Pertanyaan yang masih perlu dijawab nanti sebelum eksekusi: role apa saja yang dibutuhkan persis, apakah wasit perlu login Google atau cukup akses link tanpa login, dan apakah pembuatan turnamen benar-benar terbuka untuk semua orang atau dibatasi.

## Verifikasi & Keamanan Wasit Lapangan

- **Verifikasi Wasit via QR Code** — saat wasit login untuk menangani court tertentu, tambahkan lapisan verifikasi dengan scan QR code fisik yang ditempel di masing-masing court, untuk memastikan wasit benar-benar berada di lokasi court yang sesuai sebelum bisa input skor. Ditunda ke MVP 2 karena kompleksitas implementasi scan QR di web (vs native app) belum sepadan dengan kebutuhan MVP 1 yang masih single-tournament dan wasit dipilih manual dari daftar court/match.