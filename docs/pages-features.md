# Halaman & Fitur

## 6.1 Public — Pendaftaran (`/register`)
- Form sesuai field di `business-rules.md` §4.2
- Validasi Zod, submit via Server Action
- Tampilkan status kategori penuh/belum dibuka jika relevan

## 6.2 Admin (butuh login Google, protected route `/admin/*`)
- `/admin/login` — Google OAuth via Supabase Auth
- `/admin/teams` — kelola & verifikasi peserta (approve/reject pembayaran)
- `/admin/tournament-setup` — set jumlah court, ukuran grup, toggle golden point/third place
- `/admin/draw` — generate/regenerate drawing grup per kategori
- `/admin/schedule` — assign match ke court & jadwal waktu
- `/admin/scoring` — **halaman utama saat hari-H**: pilih court aktif → pilih match → input skor poin per poin (tombol +1 untuk tiap tim, otomatis hitung game/set/pemenang sesuai aturan §4.4/§4.6 di `business-rules.md`)
- `/admin/bracket` — trigger generate bracket knockout setelah fase grup selesai

## 6.3 Display / Layar TV (public, read-only, tanpa login)
- `/display/court/[courtId]` — live score 1 match spesifik (skor poin besar, indikator serve, nama tim & pemain)
- `/display/courts` — grid semua court sekaligus
- `/display/standings/[categoryId]` — tabel klasemen semua grup dalam kategori tsb
- `/display/bracket/[categoryId]` — bracket knockout