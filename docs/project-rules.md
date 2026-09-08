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
- Jumlah grup per kategori mengikuti jumlah tim confirmed dibagi `team_per_group` — jika tidak habis dibagi rata (misal sisa 3 tim), perlu aturan tambahan (grup ganjil dengan bye, atau gabung ke grup lain) — **tandai sebagai TODO, minta konfirmasi user sebelum implementasi generate draw**
- Pairing semifinal untuk kasus lebih dari 2 grup per kategori belum didefinisikan detail — buat fungsi pairing generik yang bisa dikonfigurasi
- Pembayaran hanya diverifikasi manual oleh admin (tidak ada payment gateway otomatis di scope ini)