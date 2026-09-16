# Aturan Ketat Pemisahan Tanggung Jawab (WAJIB, non-negotiable)

Ini aturan paling sering dilanggar AI coding agent — pastikan **selalu** diikuti
di setiap prompt/generate kode, apapun task-nya.

## A. Komponen wajib dipecah kecil (Atomic-style), tidak boleh ada duplikasi markup

- Sebelum menulis form/UI apapun, cek dulu apakah elemen dasarnya (`TextInput`, `SelectInput`, `TextAreaInput`, `FileInput`, `Button`, `Badge`, `Card`) sudah ada di `components/ui/`. Kalau belum ada, **buat dulu** sebagai komponen atomic generik di sana, baru dipakai.
- **Dilarang** menulis `<label>` + `<input>` + styling error berulang-ulang langsung di dalam komponen form besar (misal `RegistrationForm.tsx`). Itu wajib jadi komponen `<TextInput label="..." error="..." {...props} />` yang reusable.
- Komponen besar (`RegistrationForm`, `ScoringPanel`, dst) isinya **hanya composition** — merangkai komponen-komponen kecil + menghubungkan ke hook/state, bukan menulis JSX mentah berulang.

## B. Komponen di folder `components/` HARUS "dumb" (presentational only)

- File di dalam `components/` **dilarang** berisi: pemanggilan Supabase langsung, fetch data, business logic perhitungan, atau side effect kompleks.
- Komponen hanya menerima `props` dan memanggil `callback props` (`onSubmit`, `onChange`, dst). Semua logic "bagaimana data diproses" tinggal di custom hook atau Server Action.
- Contoh yang **SALAH**: `RegistrationForm.tsx` langsung berisi `supabase.from('teams').insert(...)`.
- Contoh yang **BENAR**: `RegistrationForm.tsx` hanya render UI + panggil `const { submit, isLoading, error } = useTeamRegistration()`, semua logic upload/insert ada di dalam hook `useTeamRegistration` (atau Server Action yang dipanggil hook tersebut).

## C. Custom Hooks untuk semua logic stateful yang reusable/kompleks

- Simpan di `hooks/`, dengan nama jelas: `useTeamRegistration`, `useMatchScore`, `useStandings`, `useRealtimeMatch`, dst.
- Hook bertanggung jawab atas: state lokal, pemanggilan Server Action/Supabase, error handling, loading state. Komponen tinggal "consume" hasilnya.

## D. Fungsi murni (pure function) yang reusable → taruh di `utils/` atau `lib/`

- Kalau logic-nya **tidak butuh state/hook** (misal format nomor HP, hitung game difference, format tanggal, validasi sederhana) → taruh di `utils/` sebagai pure function biasa, bukan dijadikan hook, dan bukan ditulis inline berulang di banyak file.
- Business logic khusus domain turnamen (scoring, standings, tie-breaker, bracket pairing) tetap di `lib/scoring/`, `lib/bracket/` — ini levelnya lebih spesifik dari `utils/` general-purpose. Lihat `business-rules.md` untuk detail logic-nya.

## E. State Management

- Untuk state lokal sederhana (buka/tutup modal, active tab) → cukup `useState` di hook/komponen, tidak perlu library tambahan.
- Untuk **state global lintas komponen** (misal: kategori turnamen yang sedang aktif dipilih admin, state court yang sedang di-manage di halaman scoring) → gunakan **Zustand**. Buat store di `stores/` (misal `stores/useScoringStore.ts`), jangan prop-drilling berlebihan.
- Untuk **data fetching dari Supabase yang butuh caching, refetch, sync antar komponen** (misal daftar teams, standings, match list) → gunakan **TanStack Query** (`@tanstack/react-query`). Bungkus tiap query jadi custom hook (misal `useTeamsQuery(categoryId)`, `useStandingsQuery(groupId)`), jangan `useEffect` + `fetch` manual.
- Untuk **realtime subscription Supabase** (live score, live standings) → tetap bisa dikombinasikan dengan TanStack Query (invalidate query saat ada event realtime) supaya cache tetap konsisten dengan data live.

## F. Prinsip umum

KISS (Keep It Simple, Stupid) — jangan over-engineer untuk kasus yang belum
tentu terjadi, tapi juga jangan under-engineer dengan menumpuk semua logic di
satu file besar. Kalau ragu, tanya: *"kalau nanti ada bagian ini yang berubah,
apakah saya harus edit banyak file, atau cukup 1 tempat?"* — jawaban idealnya
selalu "cukup 1 tempat".

## G. Data Statis & Konfigurasi UI Wajib di Level Modul (Module-Level Constants)

- Data statis (array/object yang tidak berubah, seperti daftar hint/petunjuk, opsi dropdown tetap, konfigurasi label, tabs filter, daftar modul) **harus didefinisikan sebagai module-level constant di luar function component**, bukan didefinisikan ulang di dalam body komponen.
- Tujuan: Menghindari re-creation referensi object/array baru di setiap re-render dan mencegah duplikasi markup berulang di JSX.
- Render elemen daftar tersebut secara data-driven menggunakan `.map()`, dan selalu sertakan `key` yang unik dan stabil (misal `item.id` atau `item.label`, bukan index array).

## H. Standardisasi Icon Menggunakan lucide-react

- Semua icon menggunakan library `lucide-react`, dilarang menulis SVG path manual inline di komponen.
- Import hanya icon yang dipakai (named import) untuk menjaga bundle size dan tree-shaking tetap optimal (contoh: `import { Users, ChevronDown } from 'lucide-react'`).
- Pengecualian: Aset brand resmi pihak ketiga (seperti logo Google OAuth 4-warna) yang tidak tersedia di `lucide-react` wajib ditempatkan di komponen icon tersendiri di `components/icons/` (misal `components/icons/GoogleIcon.tsx`), bukan ditulis inline di dalam komponen view/button.

## I. Konsistensi Bahasa dalam Kode (English Identifier vs Target Audience UI)

- Semua identifier dalam kode (nama variable, function, komponen, tipe data, kolom database, nilai enum) **WAJIB menggunakan bahasa Inggris**, terlepas dari bahasa yang dipakai di UI.
- Teks yang ditampilkan ke user (label, pesan, placeholder) mengikuti bahasa target audiens aplikasi (Bahasa Indonesia untuk admin/scoring, English untuk homepage sesuai keputusan sebelumnya).
- Contoh: variable `isReferee` (BENAR) menyimpan nilai untuk menampilkan label 'Wasit' di UI (BENAR) — bukan variable `isWasit` (SALAH).
 
## J. Standardisasi Feedback Server Action Melalui Toast Notification (via Sonner)

- Semua feedback aksi (sukses/gagal) dari Server Action **WAJIB ditampilkan sebagai toast notification (via sonner)**, bukan hanya inline text di halaman — untuk memastikan admin selalu melihat feedback meski sedang scroll di bagian manapun halaman.
- Gunakan helper standar dari `@/lib/toast` (`toast.success(message)`, `toast.error(message)`, `toast.warning(message)`) agar konsisten di seluruh aplikasi.
- Inline alert/feedback kartu di body halaman bersifat opsional/sekunder; toast notification adalah saluran komunikasi utama untuk konfirmasi aksi mutasi data admin.

## K. Clean Code Standards

- **Tidak boleh ada dead code**: import yang tidak dipakai, function/variable yang di-export tapi tidak pernah digunakan di tempat lain, komentar yang menjelaskan hal yang sudah jelas dari kode itu sendiri (self-explanatory) harus dihapus. Komentar hanya dipertahankan untuk menjelaskan "kenapa" (alasan non-obvious), bukan "apa" yang sudah jelas dari nama variable/function.
- **Hindari "god hook"**: custom hook yang menangani lebih dari 1 tanggung jawab (misal: fetch data + form state + file upload + navigasi sekaligus dalam 1 hook). Pecah menjadi beberapa hook terpisah sesuai tanggung jawab masing-masing (misal `useTeamForm`, `useTeamFileUpload`, `useTeamSubmit`), lalu compose di komponen jika perlu.
- **Panjang baris kode terukur**: Baris kode tidak boleh terlalu panjang (target maksimal ~100 karakter). JSX/props yang panjang dipecah multi-line, kondisi kompleks diekstrak ke variable/function bernama jelas terlebih dahulu.
- **Refactor branching kompleks ke object/record lookup**: Conditional rendering dengan banyak percabangan (if/else if berantai, atau switch dengan banyak case untuk menentukan tampilan) sebaiknya direfactor menjadi object/record lookup (misal: `const STATUS_CONFIG = { live: {...}, scheduled: {...}, completed: {...} }`, lalu `STATUS_CONFIG[status]`) — lebih deklaratif dan mudah ditambah kasus baru.