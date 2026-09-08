# Struktur Data (Supabase Schema — Garis Besar)

> Ini kerangka awal, boleh disesuaikan/dinormalisasi lebih lanjut saat
> implementasi, tapi relasi inti berikut wajib ada.

```
categories
- id
- name                 (e.g. "Fix Partner - Bronze")
- partner_type         (enum: fix | mix)
- level                (enum: beginner | lower_bronze | bronze)
- is_active            (boolean)

teams
- id
- category_id (FK -> categories)
- player1_name
- player2_name
- phone_number
- instagram_handle
- reclub_handle
- payment_proof_url
- status               (enum: pending | confirmed | rejected)
- created_at

tournament_settings
- id
- name
- team_per_group        (default 4, configurable)
- golden_point_enabled   (boolean)
- third_place_enabled    (boolean)
- number_of_courts
- status                (enum: draft | draw_done | ongoing | completed)

groups
- id
- category_id (FK)
- name                  (e.g. "Group A")

group_teams
- id
- group_id (FK)
- team_id (FK)

matches
- id
- category_id (FK)
- group_id (FK, nullable — null jika match knockout)
- round                 (enum: group | semifinal | final | third_place)
- team_a_id (FK -> teams)
- team_b_id (FK -> teams)
- court_id (FK -> courts, nullable jika belum dijadwalkan)
- status                (enum: scheduled | live | completed | walkover)
- winner_team_id (FK, nullable)
- games_team_a           (int, jumlah game dimenangkan team A)
- games_team_b           (int, jumlah game dimenangkan team B)
- current_point_a        (untuk live scoring: 0/15/30/40/AD)
- current_point_b
- scheduled_time
- completed_at

courts
- id
- tournament_id (FK)
- name                  (e.g. "Court 1")

standings (bisa berupa view/materialized computation, bukan tabel manual)
- team_id
- group_id
- played, won, lost, game_diff, points
```

**Catatan penting**: `standings` sebaiknya **dihitung (computed)** dari tabel
`matches` yang sudah `completed` — baik lewat SQL view/RPC function di Supabase,
ataupun dihitung di server saat fetch — jangan disimpan sebagai state manual
yang gampang out-of-sync.