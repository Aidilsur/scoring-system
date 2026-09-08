# Aturan Bisnis (Business Rules)

## 4.1 Kategori Turnamen
Kombinasi dari:
- **Tipe Partner**: `Fix Partner` (sudah punya pasangan) / `Mix Partner` (isi nama partner sendiri saat daftar — pairing tetap ditentukan di awal, bukan diacak sistem)
- **Level**: `Beginner`, `Lower Bronze`, `Bronze`

→ Total kategori = kombinasi Tipe × Level (konfigurasi kategori mana saja yang dibuka harus **dinamis**, bisa ditambah/dikurangi admin, jangan di-hardcode).

## 4.2 Pendaftaran
Field wajib:
- Kategori Kelas (pilih dari kategori yang aktif)
- Nama Pemain 1
- Nama Pemain 2 (Partner)
- Nomor HP/WA
- Akun Instagram
- Akun Reclub
- Upload bukti pembayaran (file image/pdf, disimpan di Supabase Storage)

Setelah submit → data tim masuk status `pending` sampai dikonfirmasi admin (verifikasi pembayaran) → baru berstatus `confirmed` dan ikut serta dalam drawing grup. Hanya tim `confirmed` yang diikutkan saat generate drawing.

## 4.3 Drawing Grup (Otomatis)
- Dilakukan **per kategori**, sistem tidak mencampur kategori berbeda dalam satu grup
- Ukuran grup: **4 tim per grup** (jadikan konfigurasi, jangan hardcode `4`, karena bisa berubah di turnamen lain)
- Metode random draw sederhana (shuffle tim confirmed dalam kategori tsb, lalu bagi rata ke grup A, B, C, dst)
- Setelah di-generate, admin bisa **regenerate ulang** selama status turnamen masih "belum mulai" (belum ada match yang jalan)
- Setelah drawing, sistem otomatis membuat jadwal round robin (semua lawan semua) dalam tiap grup

## 4.4 Format Skor — Fase Grup (Round Robin)

**"Best of 5 game" per match:**
- Tim yang lebih dulu menang **3 game** dari total maksimal 5 game, menang match
- Jika skor game menjadi **2-2**, game ke-5 dimainkan sebagai **tie-break** (race to 7, selisih minimal 2) sebagai penentu
- Dalam tiap game, skor poin mengikuti aturan padel standar: `0 → 15 → 30 → 40 → Game`, dengan **Golden Point** saat deuce (40-40) — poin berikutnya langsung menentukan pemenang game, tidak ada ventaja/advantage berkepanjangan (opsi ini harus bisa di-toggle per turnamen di setting, default: ON)
- Match hasil normal selalu punya pemenang. Status `draw` hanya dipakai untuk kasus administratif: **WO (walk-over) kedua tim** / tidak hadir bersamaan — bukan hasil dari permainan normal

## 4.5 Perhitungan Klasemen Grup
Kolom yang ditampilkan per tim dalam grup:

| Kolom | Arti | Cara Hitung |
|---|---|---|
| T | Total Main | Jumlah match yang sudah dimainkan |
| M | Menang | Jumlah match menang |
| K | Kalah | Jumlah match kalah |
| S (GD) | Selisih Game | (Total game dimenangkan) − (Total game dikalahkan), akumulasi semua match |
| P | Poin | Menang = **3**, Draw (WO ganda) = **1**, Kalah = **0** |

**Urutan ranking dalam grup** (dari prioritas tertinggi):
1. Poin (P) tertinggi
2. Jika sama → Head-to-head (hasil pertemuan langsung antar tim yang sama poin)
3. Jika masih sama → Selisih Game (S) tertinggi
4. Jika masih sama → Total Game Menang tertinggi
5. Jika masih sama juga → tentukan manual oleh admin (coin toss/keputusan panitia), sistem tampilkan alert "perlu keputusan manual"

Peringkat **1 dan 2 tiap grup lolos ke Semifinal**.

## 4.6 Format Skor — Semifinal & Final (Knockout)
- **First to 6 game**: tim yang lebih dulu mencapai 6 game menang match
- Jika skor mencapai **5-5**, dimainkan **golden game / tie-break penentu** di game ke-6 (bukan harus menang selisih 2 — cukup menang tie-break tersebut) untuk mempercepat durasi turnamen
- Aturan poin dalam game sama seperti fase grup (Golden Point saat deuce)
- Tidak ada skenario draw di babak ini — harus selalu ada pemenang untuk lanjut bracket

## 4.7 Bracket Knockout
- Pairing semifinal: Juara Grup A vs Runner-up Grup B, Juara Grup B vs Runner-up Grup A (pola silang), sesuaikan lagi jika jumlah grup lebih dari 2 — buat logic pairing yang scalable (bukan hardcode 2 grup)
- Ada opsi pertandingan **perebutan Juara 3** antara 2 tim yang kalah di semifinal (opsional, bisa di-toggle di setting turnamen)
- Bracket ditampilkan sebagai pohon horizontal: Quarter Final (jika ada) → Semi Final → Final → Juara, dengan skor final tiap match dan highlight pemenang

## 4.8 Multi-Court & Sinkronisasi Data
- Setiap match di-assign ke **Court tertentu** (Court 1, Court 2, dst — jumlah court dikonfigurasi admin di awal turnamen)
- Admin menggunakan **1 device untuk semua court** — saat input skor, admin memilih dulu "Court berapa / Match mana" yang sedang diupdate
- Karena tiap match punya row unik di tabel `matches` dan diupdate lewat Server Action yang menulis ke Supabase, tidak ada race condition antar court — masing-masing match independen
- Layar TV per court subscribe **hanya ke match yang sedang aktif di court tersebut** (Supabase Realtime channel filtered by `court_id`), sehingga update skor di Court 1 tidak memicu re-render di layar Court 2
- Halaman klasemen & bracket subscribe ke perubahan tabel `matches`/`standings` secara keseluruhan agar auto-update begitu ada skor final masuk