# Desain / UI Theme

**Tema**: Sport Technology — modern, dark-mode dominan, aksen warna terang untuk status live.

- Base: dark background (slate/zinc-900 ke bawah) supaya nyaman dilihat di TV/dalam ruangan
- Aksen warna: hijau untuk status "Live"/menang, kuning/gold untuk "Serving"/highlight pemenang, abu-abu untuk status netral ("Belum Main")
- Tidak perlu meniru 1:1 desain referensi (screenshot "Landed Cup") — boleh pakai gaya sendiri, tapi pertahankan pola informasi berikut karena sudah terbukti efektif dibaca dari jarak jauh (layar TV):
  - Kode/inisial tim ditampilkan besar dengan warna badge solid (bukan hanya teks kecil)
  - Skor poin dalam game (00/15/30/40) ditampilkan jauh lebih besar dari skor game/set
  - Indikator "sedang serve" jelas terlihat (border/glow kuning)
  - Badge status: `LIVE`, `BELUM MAIN`, `SELESAI` dengan warna berbeda
  - Multi-court view: card per court disusun grid horizontal, tiap card independen (tidak boleh saling menunggu re-render)
  - Klasemen grup: tabel dengan kolom **T M K S P** (Total Main, Menang, Kalah, Selisih Game, Poin), baris juara grup diberi highlight (misal warna emas/hijau tipis)
  - Bracket knockout: struktur pohon horizontal (Quarter → Semi → Final → Juara), match yang sudah selesai tampilkan skor final, pemenang di-highlight
- Responsive: halaman admin harus nyaman di tablet/laptop; halaman display dioptimalkan untuk layar lebar (TV 16:9), halaman pendaftaran dioptimalkan untuk mobile