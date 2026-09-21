# Project Rules — Overview & Tech Stack

## 1. Ringkasan Proyek

Sistem **Sport Technology** untuk mengelola turnamen padel end-to-end:
pendaftaran peserta → drawing grup otomatis → input skor live per court →
klasemen real-time → knockout (semifinal & final) → bracket juara.

Ada 3 jenis pengguna:

| Role | Akses | Device |
|---|---|---|
| **Peserta (Public)** | Halaman pendaftaran | Mobile/desktop, tanpa login |
| **Admin** | Setup turnamen, input skor, kelola peserta | 1 device untuk semua court, login Google |
| **Penonton / Layar TV** | Live score, klasemen, bracket (read-only) | TV di tiap lapangan / layar utama, tanpa login |

---

## 2. Tech Stack

- **Framework**: Next.js (App Router) + **TypeScript** (strict mode)
- **Styling**: Tailwind CSS (utility-first, tanpa CSS module terpisah kecuali perlu)
- **Backend/DB**: **Supabase**
  - Postgres sebagai database utama
  - **Supabase Auth** — Google OAuth khusus untuk login Admin
  - **Supabase Realtime** — subscribe perubahan tabel `matches` & `standings` agar layar TV dan klasemen update otomatis tanpa refresh/polling manual
  - **Supabase Storage** — upload bukti pembayaran saat pendaftaran (bucket privat, hanya admin yang bisa akses)
- **Validation**: Zod (schema validation form pendaftaran & input skor)
- **State management**: React Server Components sebagai default, Client Component hanya untuk bagian interaktif/realtime (live score, form)
- **Deployment target**: Vercel (asumsikan, sesuaikan bila beda)

### Prinsip Best Practice Wajib
- Semua tipe data (Team, Player, Match, Group, Standing, dll) didefinisikan di `types/` dan digenerate/selaras dengan schema Supabase (`supabase gen types typescript`)
- Business logic (perhitungan skor, klasemen, tie-breaker) **dipisah dari komponen UI** → taruh di `lib/scoring/` sebagai pure functions yang bisa di-unit-test
- Tidak ada logic penting yang hanya hidup di client component — perhitungan skor final tetap divalidasi di server (Server Action / API Route) supaya tidak bisa dimanipulasi dari browser
- Gunakan Server Actions untuk mutasi data (create match, update score, generate draw) alih-alih client-side fetch ke API route jika memungkinkan
- Naming konsisten: file/folder `kebab-case`, komponen `PascalCase`, function/variable `camelCase`, custom hook diawali `use` (`useMatchScore`, `useTeamRegistration`)
- Environment variables untuk semua Supabase keys, tidak ada hardcode

> Aturan detail pemisahan komponen/hooks/lib ada di `component-architecture.md` — wajib dibaca sebelum menulis UI atau logic apapun.

---

## 7. Struktur Folder yang Disarankan

```
app/
  register/
  admin/
    login/
    teams/
    tournament-setup/
    draw/
    schedule/
    scoring/
    bracket/
  display/
    court/[courtId]/
    courts/
    standings/[categoryId]/
    bracket/[categoryId]/
components/
  ui/                  (TextInput, SelectInput, TextAreaInput, FileInput, Button, Badge, Card — atomic, presentational-only, reusable di seluruh app)
  registration/        (RegistrationForm — hanya compose komponen ui/, tanpa logic)
  scoring/             (ScoreCard, PointDisplay, ServeIndicator — presentational-only)
  standings/           (StandingsTable — presentational-only)
  bracket/             (BracketTree, BracketNode — presentational-only)
hooks/
  useTeamRegistration.ts   (logic submit form pendaftaran: validasi, upload, insert, loading/error state)
  useMatchScore.ts         (logic update skor live per match)
  useStandingsQuery.ts     (fetch + cache klasemen, wrap TanStack Query)
  useRealtimeMatch.ts      (subscribe Supabase Realtime untuk 1 match/court)
utils/
  format.ts            (pure function generic: formatPhoneNumber, formatDate, dll — TIDAK spesifik domain padel)
lib/
  supabase/            (client.ts, server.ts, middleware.ts)
  scoring/             (pure functions spesifik domain: calculateGameWinner, calculateMatchWinner, calculateStandings, tieBreakerResolver)
  bracket/             (pure functions: generateBracketPairing)
  validations/         (zod schemas)
stores/
  useScoringStore.ts   (Zustand — state global misal: court aktif yang sedang di-manage admin)
types/
  database.types.ts    (generated dari supabase)
  domain.ts            (Team, Match, Group, dll — turunan dari database.types)
```

**Dependency tambahan yang perlu diinstall untuk mendukung standar di atas:**
```bash
npm install zustand @tanstack/react-query
```

---

## 8. Asumsi & Hal yang Perlu Dikonfirmasi Saat Implementasi

- Golden Point saat deuce diasumsikan **default ON**, tapi dibuat toggleable per turnamen
- Jika jumlah tim tidak habis dibagi rata sesuai target ukuran grup, sistem mendistribusikan tim seserata mungkin antar grup (misal 14 tim target 4/grup → menghasilkan grup berisi 5,5,4 bukan 4,4,4,2), diimplementasikan di lib/draw/distributeTeamsToGroups.ts.
- Bracket 3+ grup per kategori AKAN didukung, tapi aturan pairing detailnya BELUM ditentukan (menunggu keputusan lebih lanjut). Implementasi generateBracketPairing() saat ini HANYA menangani kasus 2 grup (pola silang: Juara A vs Runner-up B, Juara B vs Runner-up A). Jika dipanggil dengan jumlah grup selain 2, function harus melempar error yang jelas ('Pairing untuk N grup belum didukung'), BUKAN diam-diam menghasilkan bracket yang salah.
- Pembayaran hanya diverifikasi manual oleh admin (tidak ada payment gateway otomatis di scope ini)
- TODO: Belum ada batasan max_teams per kategori. Karena court adalah resource bersama lintas kategori (bukan eksklusif), total kapasitas penjadwalan bergantung pada KOMBINASI semua kategori aktif, bukan cuma 1 kategori sendirian. Saat ini sistem hanya mengandalkan 'unscheduled' array dari algoritma sebagai jaring pengaman (admin akan diberi tahu saat generate schedule jika ada match yang tidak muat), bukan pencegahan di level pendaftaran. Pertimbangkan menambah field max_teams di categories sebagai soft cap preventif di masa depan.
- **Fitur delete kategori sudah diimplementasikan dengan constraint:** hanya bisa dilakukan saat `is_active = false`, dan tetap dibatasi `ON DELETE RESTRICT` di level database jika masih ada tim terdaftar (dengan pesan ramah pengguna).
- **Perlu didefinisikan behavior saat admin menonaktifkan kategori yang SEDANG berjalan proses pendaftarannya:** race condition saat peserta sedang isi form pendaftaran lalu admin melakukan toggle nonaktif — apakah submit tetap diproses, ditolak, atau form perlu melakukan re-validate status kategori sebelum submit/upload bukti pembayaran?
- **TODO (brainstorming lanjutan, belum diprioritaskan):**
  1. **Max Team Registration Cap** — batasan jumlah tim maksimal per kategori (terkait juga dengan kapasitas court/jadwal, lihat catatan sebelumnya di section ini soal `max_teams`).
  2. **Periode Pendaftaran Otomatis** — perluasan TODO periode buka/tutup pendaftaran otomatis: pertimbangkan link pendaftaran per kategori hanya bisa diakses dalam rentang tanggal tertentu (bukan cuma toggle `is_active` manual), dan pesan berbeda untuk status "belum buka" vs "sudah tutup" ke calon peserta.
  3. **Mekanisme Refund/Penolakan Peserta** — jika tim mendaftar dan sudah upload bukti pembayaran, tapi ternyata ditolak kurasi (misal karena kuota penuh, dokumen tidak valid, dll), perlu ada mekanisme agar peserta tidak merasa "uang hilang begitu saja". Kemungkinan solusi awal: tampilkan kontak panitia (WA/email) di halaman status pendaftaran atau di notifikasi penolakan, agar peserta bisa menghubungi untuk proses refund manual. Belum diputuskan apakah refund diproses manual di luar sistem, atau perlu ada tracking status `'refunded'` di database.
  4. **Multi-Hari Turnamen** — Sistem saat ini mengasumsikan turnamen berjalan 1 HARI (`daily_start_time`/`daily_end_time` bersifat harian). Untuk turnamen dengan banyak tim/kategori, 1 hari mungkin tidak cukup. Perlu didiskusikan: apakah sistem perlu mendukung multi-hari (misal field `tournament_date` range, atau field 'hari ke berapa' per match), atau cukup membatasi jumlah tim/kategori yang didaftarkan agar selalu muat 1 hari.
  5. **Pengurangan `number_of_courts` & Dampak ke Match `completed` (Perlu Dibahas)** — Mengurangi `number_of_courts` saat ini hanya memvalidasi match berstatus `scheduled`/`live` sebelum menghapus court surplus (`app/admin/(protected)/tournament-setup/actions.ts`). Karena constraint database `courts -> matches` menggunakan `ON DELETE SET NULL` (bukan `RESTRICT`), menghapus court yang PERNAH dipakai match `completed` akan mengubah `court_id` match tersebut menjadi `NULL` — menghilangkan info historis "match ini dimainkan di court mana" secara permanen.
     Pertanyaan yang perlu dijawab sebelum perbaikan:
     - Apakah court yang pernah dipakai match apapun (termasuk `completed`) seharusnya TIDAK BISA dikurangi sama sekali selama turnamen berjalan (opsi ketat, konsisten menjaga histori)?
     - Atau tetap boleh dihapus, tapi admin diberi warning eksplisit sebelum submit (*"Court ini pernah dipakai N match selesai, data historis lapangan akan hilang — lanjutkan?"*)?
     *(Ditemukan saat testing refactor `useTournamentSettingsForm` — belum ada laporan masalah riil, tapi berisiko jika dipakai di turnamen yang sudah berjalan sampai fase knockout).*