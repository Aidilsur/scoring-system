# Desain & UI Theme — Padel Tournament Scoring System

Dokumen ini adalah acuan final dan tunggal untuk seluruh implementasi antarmuka (UI/UX) baik pada layar publik (Landing Page, TV Display, Registrasi) maupun konsol Admin.

---

## 1. Filosofi Visual: Sport Broadcast Modern (Tanpa Foto)

Sistem mengusung tema **Sport Technology & Modern Broadcast** dengan kontras tinggi, presisi, dan keterbacaan optimal dari jarak jauh (layar TV 16:9) maupun layar sentuh (tablet/ponsel).

> **Prinsip Utama Visual**:
> 1. **DILARANG menggunakan fotografi atlet**, hero image orang, atau stock photo dominan.
> 2. **Hindari Pola Generik**: Dilarang menggunakan pola *"center-aligned text + badge pills berjejer"* yang terkesan template/generik.
> 3. **Layout Asimetris & Align Kiri**: Utamakan komposisi asimetris, perataan kiri (*left-aligned*), dengan tipografi raksasa sebagai jangkar visual utama.
> 4. **Dekorasi Garis Geometris Lapangan (Pengganti Foto)**: Gunakan elemen SVG garis tipis geometris (motif garis lapangan padel: service line, net line, glass wall perimeter) dengan opasitas rendah sebagai pengganti foto, bukan deretan badge/icon.
> 5. **Aksen Lime Green Terang (`lime-400` / `#a3e635`)**: Digunakan secara terarah untuk status LIVE, angka skor aktif, tombol aksi utama, dan border fokus/highlight di atas latar hampir hitam.
> 6. **Micro-Interactions**: Animasi transisi halus (*fade*, *scale*, denyut glow) pada perubahan skor dan perpindahan giliran serve.

---

## 2. Tipografi Resmi (Official Font Stack)

Sistem menggunakan kombinasi dua Google Fonts yang diimpor melalui `next/font/google`:

| Peruntukan | Font Family | Sumber & Konfigurasi | Karakteristik & Penggunaan |
|---|---|---|---|
| **Display & Headline Utama** | **Anton** | `next/font/google` (`--font-anton`, weight: 400) | Sangat bold, condensed, dan berbobot visual tinggi. Digunakan khusus untuk judul besar, hero tournament headline, dan angka skor raksasa. |
| **Body & Antarmuka (UI)** | **Space Grotesk** | `next/font/google` (`--font-space-grotesk`) | Geometris, modern, presisi teknikal. Digunakan untuk teks umum, body copy, label input, tombol, metadata court, dan tabel. |
| **Monospace / Angka Data** | **Geist Mono** / Monospace | `next/font/google` (`--font-geist-mono`) | Digunakan untuk format waktu, timer skor, kode tim, dan anotasi teknis. |

---

## 3. Palet Warna (Near-Black + Lime Accent)

| Token / Elemen | Nilai / Tailwind Class | Deskripsi & Aturan Penggunaan |
|---|---|---|
| **Base Background** | `bg-zinc-950` (`#09090b`) | Latar belakang dasar utama seluruh halaman (hampir hitam) |
| **Undertone Gradient** | `bg-emerald-600/10` (radial blur) | Hijau **HANYA** sebagai undertone gradient sangat halus di satu sudut (opasitas rendah), **BUKAN warna dominan** |
| **Surface / Card Default** | `bg-zinc-900/80` / `bg-emerald-950/80` | Kartu konten standar, tabel, modal dialog, panel form |
| **Surface / Card Elevated**| `bg-zinc-900` border `border-zinc-800` | Kartu fokus, panel scoring, card live match |
| **Border Tipis** | `border-zinc-800` / `border-emerald-800/80` | Garis tepi kartu, pemisah seksi, outline field |
| **Input Surface** | `bg-zinc-900/90` border `border-zinc-800` | Field input teks, select, toggle container |
| **Aksen Utama (Vibrant Lime)**| `lime-400` (`#a3e635` / `#C3F53C`) | **Wajib**: Badge LIVE, angka skor yang sedang aktif/berubah, tombol primary, border aktif, serving ball |
| **Teks Utama** | `text-white` / `text-zinc-100` | Heading display, nama tim, skor set tetap |
| **Teks Sekunder / Label** | `text-zinc-400` / `text-emerald-300` | Label field, metadata lapangan, hint text |
| **Aksen Bahaya / Kalah** | `red-500` / `rose-500` | Status reject, tim kalah, alert error, tombol hapus |
| **Aksen Netral / Belum Main**| `text-zinc-400`, `bg-zinc-800`, `border-zinc-700`| Pertandingan terjadwal/belum mulai (**Dilarang menggunakan hijau/lime**) |

---

## 4. Pola Tipografi & Komponen UI

- **Headline Nama Turnamen & Judul Halaman**:
  - Font: **Anton** (`font-[family-name:var(--font-anton)]`), uppercase, tracking-tight, leading rapat (`leading-[0.92]`).
  - Skala ukuran masif: `text-5xl sm:text-7xl md:text-8xl lg:text-[7.5vw]`.
  - Penataan: **Align kiri (asimetris)**, boleh wrap hingga 2 baris.
- **Angka Skor Pertandingan**:
  - Ukuran besar, bold/black weight, tabular-nums.
  - **Aturan Warna Skor**: **HANYA** angka skor yang sedang aktif/berubah dalam set berjalan yang diberi warna aksen **Lime (`text-lime-400`)**. Angka skor pada set yang sudah selesai atau belum dimulai **tetap berwarna putih (`text-white`)**.
- **Badge Status LIVE**:
  - Pill badge bulat (`rounded-full`) minimalis.
  - Titik indikator kecil berdenyut di kiri teks (`w-2 h-2 rounded-full bg-lime-400 animate-pulse`).
  - Warna: `bg-lime-400/15 border border-lime-400/30 text-lime-400`.
- **Card Pertandingan**:
  - Background `zinc-900` atau `emerald-950/80`, border tipis `border-zinc-800`, radius sedang (`rounded-xl`), padding cukup lega (`p-6`).
- **Tombol Utama (Primary Button)**:
  - Solid lime: `bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black tracking-wide shadow-lg shadow-lime-400/20 active:scale-[0.99] rounded-xl`.

---

## 5. Pola UI Spesifik Turnamen

### A. "Match List Overview" (`/display/courts`)
- **Tujuan**: Monitor overview multi-court di lobby atau layar informasi sentral.
- **Tampilan**: Grid kartu per lapangan (2–4 kolom responsif).
- **Struktur Tiap Card**:
  - Header: Nomor court ("COURT 1") + Badge Status (`LIVE` warna lime dengan titik indikator, `BELUM MAIN` abu-abu muted, `SELESAI` hijau tua gelap/putih).
  - Body: 2 baris tim bertanding (Tim A vs Tim B).
  - Skor Set & Poin: Angka poin game berjalan di-highlight lime jika match live.
  - Reaktif: Tiap kartu subscribe update Supabase Realtime secara independen.

### B. "Court Live Score Card" (`/display/court/[courtId]`)
- **Tujuan**: TV display di atas masing-masing court (16:9 full screen, view jarak jauh 10–20m).
- **Struktur**:
  - Tengah: Skor poin game berjalan raksasa (`text-6xl` s/d `text-7xl`), angka aktif berwarna `text-lime-400`.
  - Sisi Kiri & Kanan: Nama tim & inisial.
  - Indikator Servis: Border highlight lime (`ring-4 ring-lime-400/80`) atau bola serve lime di sisi tim yang memegang servis.
  - Bawah: Skor game per set (Set 1, Set 2, Set 3) berukuran lebih kecil dengan warna putih solid.

### C. "Date Strip Selector" (`/admin/schedule`)
- **Tujuan**: Baris pemilih tanggal horizontal scrollable untuk assign jadwal pertandingan ke court.
- **Item Tanggal**: Tanggal aktif di-highlight solid lime (`bg-lime-400 text-zinc-950 font-black shadow-md shadow-lime-400/25`), tanggal non-aktif menggunakan `bg-zinc-900 border border-zinc-800 text-zinc-400`.

### D. "Klasemen Grup (Group Standings Table)"
- Kolom: **T M K S P** (Total Main, Menang, Kalah, Selisih Game, Poin).
- Baris juara grup (peringkat 1) mendapatkan highlight strip lime tipis di sisi kiri (`border-l-4 border-lime-400 bg-lime-400/10 text-white`). Baris runner-up mendapatkan aksen emerald (`border-l-4 border-emerald-400 bg-emerald-400/10`).

### E. "Bagan Gugur (Knockout Bracket Tree)"
- Struktur visual pohon horizontal dari kiri ke kanan.
- Tim pemenang setiap babak di-highlight tebal dengan badge skor berwarna lime.