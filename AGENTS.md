<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Padel Tournament Scoring System — Project Rules

Sistem Sport Technology untuk mengelola turnamen padel end-to-end: pendaftaran →
drawing grup → live scoring → klasemen real-time → knockout → bracket juara.

Stack: Next.js (App Router) + TypeScript strict + Tailwind + Supabase (Postgres,
Auth Google, Realtime, Storage) + Zod + TanStack Query + Zustand.

## Baca dokumentasi berikut SEBELUM menulis kode, sesuai bagian yang sedang dikerjakan

- `docs/project-rules.md` — overview project, tech stack, struktur folder, asumsi. **Selalu baca ini di awal sesi.**
- `docs/component-architecture.md` — aturan wajib pemisahan komponen/hooks/lib. **Baca sebelum menulis komponen, hook, atau UI apapun.**
- `docs/business-rules.md` — aturan bisnis: kategori, pendaftaran, drawing, format skor, klasemen, bracket. **Baca sebelum mengerjakan logic scoring/drawing/standings.**
- `docs/database-schema.md` — skema Supabase. **Baca sebelum mengerjakan query/migration/types.**
- `docs/design-theme.md` — tema UI & pola tampilan. **Baca sebelum mengerjakan halaman display/admin.**
- `docs/pages-features.md` — daftar halaman & fitur per role.
- `docs/roadmap-mvp2.md` — rencana masa depan (multi-tenant). **JANGAN diimplementasikan sekarang** — hanya baca kalau diminta eksplisit.

## Aturan wajib (ringkasan, detail lengkap di file terkait)

- Perubahan schema database HANYA boleh dilakukan lewat file migration di `supabase/migrations/`. DILARANG mengeksekusi SQL (`CREATE TABLE`, `ALTER`, dll) langsung ke database remote lewat tool/MCP apapun tanpa melalui migration file dan tanpa persetujuan eksplisit dari user, bahkan untuk keperluan testing sekalipun.
- Business logic terpisah dari UI: `components/` harus "dumb" (presentational only), semua logic ada di `hooks/` atau Server Action.
- Perhitungan skor final selalu divalidasi di server, tidak boleh hanya di client.
- Naming: file/folder `kebab-case`, komponen `PascalCase`, function/variable `camelCase`, hook diawali `use`.
- Jangan hardcode nilai yang seharusnya konfigurasi turnamen (ukuran grup, golden point, dst).
- KISS — jangan over-engineer, jangan juga menumpuk semua logic di satu file besar.