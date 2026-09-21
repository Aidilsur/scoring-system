# Laporan Audit Clean Code Standards (§K)

Dokumen ini berisi hasil audit komprehensif terhadap seluruh codebase Padel Tournament Scoring System berdasarkan aturan di `docs/component-architecture.md` (§K - Clean Code Standards).

---

## Ringkasan Matriks Prioritas per Modul

Daftar modul diurutkan berdasarkan tingkat urgensi dan jumlah pelanggaran terbanyak:

| Prioritas | Modul | Dead Code | God Hooks | Baris >100 Karakter | Refactor Record Lookup | Komentar Redundant |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **P1** | **`admin/schedule`** | ~~18 temuan~~ ✅ Selesai dibersihkan | 2 hooks (`useScheduleManagement`, `useKnockoutSchedule`) | ~~226 baris~~ ✅ Selesai di-wrap & dipecah | ~~Status match badge (Grid & Knockout)~~ ✅ Selesai di-refactor (`MATCH_STATUS_CONFIG`) | ~~2~~ ✅ Dihapus |
| **P2** | **`display`** | ~~14 temuan~~ ✅ Selesai dibersihkan | 1 hook (`useCourtLiveDisplay`) | ~~232 baris~~ ✅ Selesai di-wrap | ~~`ROUND_LABELS` & dead code `formatLevel`~~ ✅ Selesai | ~~3~~ ✅ Dihapus |
| **P3** | **`admin/scoring`** | ~~12 temuan~~ ✅ Selesai dibersihkan | 1 hook (`useScoringManagement` 375 baris) | ~~132 baris~~ ✅ Selesai di-wrap | ~~Status badge & `ROUND_LABELS`~~ ✅ Selesai di-refactor | ~~2~~ ✅ Dihapus |
| **P4** | **`admin/bracket`** | ~~8 temuan~~ ✅ Selesai dibersihkan | ~~1 hook (`useBracketManagement`)~~ ✅ Dipecah (`useBracketMutations`) | ~~68 baris~~ ✅ Selesai di-wrap | - | ~~1~~ ✅ Dihapus |
| **P5** | **`admin/tournament-setup`** | ~~6 temuan~~ ✅ Selesai dibersihkan | 1 hook (`useTournamentSettingsForm`) | ~~62 baris~~ ✅ Selesai di-wrap | ~~`TOURNAMENT_STATUS_CONFIG`~~ ✅ Selesai di-refactor | ~~1~~ ✅ Dihapus |
| **P6** | **`admin/categories`** | ~~4 temuan~~ ✅ Selesai dibersihkan | ~~1 hook (`useCategoriesManagement`)~~ ✅ Dipecah (`useCategoryFormModal`, `useCategoryMutations`) | ~~53 baris~~ ✅ Selesai di-wrap | ~~`CATEGORY_LEVEL_CONFIG`~~ ✅ Selesai di-refactor | ~~2~~ ✅ Dihapus |
| **P7** | **`register`** | ~~4 temuan~~ ✅ Selesai dibersihkan | 1 hook (`useTeamRegistration`) | ~~13 baris~~ ✅ 0 baris | - | ~~3~~ ✅ Dihapus |
| **P8** | **`admin/teams`** | ~~2 temuan~~ ✅ Selesai dibersihkan | ~~1 hook (`useTeamsManagement`)~~ ✅ Dipecah (`useTeamFilters`, `useTeamMutations`) | ~~38 baris~~ ✅ 0 baris | - | ~~1~~ ✅ Dihapus |
| **P9** | **`admin/draw`** | ~~10 temuan~~ ✅ Selesai dibersihkan | Relatif bersih | ~~37 baris~~ ✅ 0 baris | - | ~~1~~ ✅ Dihapus |

---

## Bagian 1: Temuan Detail Berdasarkan 5 Kategori §K

### 1. Dead Code

#### A. Unused Imports & Variables
- ~~**admin/schedule**~~ (✅ Selesai dibersihkan):
  - ~~`components/schedule/ScheduleGridView.tsx`:~~
    - ~~L4-L5: Import `Users`, `CheckCircle2`, `Play`, `AlertCircle`, `Badge` tidak pernah digunakan.~~
    - ~~L77-L79: Variable `startTime`, `endTime`, `durationMinutes` di-destructure tapi tidak dipakai.~~
  - ~~`components/schedule/ScheduleManagementView.tsx`:~~
    - ~~L86: Variable `unscheduledWarning` dihitung tapi tidak dipakai.~~
  - ~~`components/schedule/SchedulePreviewCard.tsx`:~~
    - ~~L5, L11: Import `Calendar` dan `Play` tidak pernah dipakai.~~
  - ~~`components/schedule/ScheduleWarningCard.tsx`:~~
    - ~~L4: Import `Clock`, `PlusCircle`, `Sliders` tidak terpakai.~~
  - ~~`components/schedule/KnockoutScheduleTab.tsx`:~~
    - ~~L17: Import `KnockoutRoundItem` tidak terpakai.~~
  - ~~`hooks/useKnockoutSchedule.ts`:~~
    - ~~L8: Import type `MatchRound` tidak terpakai.~~
  - ~~`hooks/useScheduleQuery.ts`:~~
    - ~~L108: Variable `categoryIds` di-assign tapi tidak terpakai.~~
- ~~**admin/scoring**~~ (✅ Selesai dibersihkan):
  - `components/scoring/CourtMatchList.tsx`:
    - ~~L4: Import `AlertCircle` tidak terpakai.~~
  - `components/scoring/CourtSelectionView.tsx`:
    - ~~L6, L14: Import `Button` dan prop `userEmail` tidak terpakai.~~
  - `components/scoring/LiveScoringBoard.tsx`:
    - ~~L11, L77: Import `Zap` dan variable `isKnockoutGoldenGame` tidak terpakai.~~
  - `app/admin/(protected)/scoring/[courtId]/page.tsx`:
    - ~~L14: Param `courtId` di-destructure tapi tidak dipakai.~~
  - `app/admin/(protected)/scoring/[courtId]/[matchId]/page.tsx`:
    - ~~L14: Param `matchId` di-destructure tapi tidak dipakai.~~
  - `app/admin/(protected)/scoring/actions.ts`:
    - ~~L39, L127, L169, L255, L526: Parameter `_userIdentifier` tidak digunakan dalam body fungsi~~ (dipertahankan aman dengan prefix `_userIdentifier?: string` untuk kompatibilitas pemanggil).
- ~~**admin/bracket**~~ (✅ Selesai dibersihkan):
  - `components/bracket/BracketManagementView.tsx`:
    - ~~L8, L11: Import `Play`, `Info` tidak terpakai.~~
    - ~~L32, L33: Query state `isCategoriesError` dan `categoriesError` tidak dipakai.~~
  - `hooks/useBracketManagement.ts`:
    - ~~L9: Variable `BRACKET_CATEGORIES_QUERY_KEY` tidak terpakai.~~
- ~~**display**~~ (✅ Selesai dibersihkan):
  - `components/display/CategoryStandingsView.tsx`:
    - ~~L25, L31: Fungsi `formatPartnerType` dan `formatLevel` dideklarasikan lokal tapi tidak pernah dipanggil~~ (dihapus).
  - `components/display/CourtLiveDisplay.tsx`:
    - ~~L16: Import type `Match` tidak terpakai~~ (dihapus).
  - `components/display/CourtOverviewCard.tsx`:
    - ~~L9: Import `Maximize2` tidak terpakai~~ (dihapus).
  - `components/display/CourtsOverviewGrid.tsx`:
    - ~~L10, L16: Import `Calendar` dan `Badge` tidak terpakai~~ (dihapus).
  - `components/display/StandingsOverviewCard.tsx`:
    - ~~L12: Import `Calendar` tidak terpakai~~ (dihapus).
  - `components/display/StandingsOverviewGrid.tsx`:
    - ~~L16: Import `Badge` tidak terpakai~~ (dihapus).
  - `hooks/useCourtLiveDisplay.ts`:
    - ~~L62: Variable `matches` dari query result tidak terpakai~~ (dihapus).
- **admin/tournament-setup (✅ Selesai)**:
  - `hooks/useTournamentSettingsForm.ts`:
    - ~~L7: Import type `TournamentSettingsInput` tidak terpakai.~~

#### B. Unused Exported Functions & Types (Export tanpa consumer luar)
- ~~**admin/scoring**~~ (✅ Selesai dibersihkan):
  - `app/admin/(protected)/scoring/actions.ts`:
    - ~~L635: `export async function getScoreHistoryCountAction(...)`~~ (Server action dihapus karena tidak pernah dipanggil).
    - ~~L16, L22: Type `ScoringActionResponse`, `SessionClaimResponse`~~ (dijadikan internal interface).
  - `hooks/useMatchDetailQuery.ts`:
    - ~~L10: `export const matchHistoryCountQueryKey`~~ (dihapus).
  - `components/scoring/ScoringView.tsx`:
    - ~~L20: Duplikasi ekspor `export function ScoringView`~~ (diperbaiki menjadi internal function, tetap `export default ScoringView`).
- **admin/draw (✅ Selesai)**:
  - `lib/draw/generateGroupDraw.ts`:
    - ~~L15, L29: Fungsi `shuffle` dan `formatGroupName` diekspor~~ (dijadikan fungsi internal).
  - `lib/draw/generateRoundRobinSchedule.ts`:
    - ~~L1: Type `RoundRobinMatchPair`~~ (dijadikan interface internal).
  - `hooks/useDrawQuery.ts`:
    - ~~L9: `ACTIVE_CATEGORIES_QUERY_KEY`~~ (dijadikan konstanta internal).
- **admin/teams (✅ Selesai)**:
  - `app/admin/(protected)/teams/actions.ts`:
    - ~~L6: Interface `ActionResponse`~~ (dijadikan interface internal).
  - `hooks/useTeamsQuery.ts`:
    - ~~L7: Interface `TeamsQueryFilters`~~ (dijadikan interface internal).
- **admin/categories (✅ Selesai)**:
  - `app/admin/(protected)/categories/actions.ts`:
    - ~~L12: Interface `CategoryActionResponse`~~ (dijadikan interface internal).
  - `hooks/useCategoriesManagement.ts`:
    - ~~L11: Interface `ToastNotification`~~ (dijadikan interface internal).
  - `components/categories/CategoryFormModal.tsx`:
    - ~~L27: Interface `CategoryFormModalProps`~~ (dijadikan interface internal).
  - `components/categories/CategoryTable.tsx`:
    - ~~L47: Interface `CategoryTableProps`~~ (dijadikan interface internal).
- **admin/tournament-setup (✅ Selesai)**:
  - `hooks/useTournamentSettingsForm.ts`:
    - ~~L17: Interface `ToastFeedback`~~ (dijadikan interface internal).
  - `app/admin/(protected)/tournament-setup/actions.ts`:
    - ~~L11: Interface `TournamentActionResponse`~~ (dijadikan interface internal).
  - `components/tournament-setup/TournamentSetupView.tsx`:
    - ~~L12: Interface `TournamentSetupViewProps`~~ (dijadikan interface internal).
  - `components/tournament-setup/TournamentSetupForm.tsx`:
    - ~~L11: Interface `TournamentSetupFormProps`~~ (dijadikan interface internal).
- **admin/bracket (✅ Selesai)**:
  - `app/admin/(protected)/bracket/actions.ts`:
    - ~~L14: Interface `BracketActionResponse`~~ (dijadikan interface internal).
  - `components/bracket/BracketManagementView.tsx`:
    - ~~L24: Interface `BracketManagementViewProps`~~ (dijadikan interface internal).
  - `components/bracket/FinalPairingCard.tsx`:
    - ~~L7: Interface `FinalPairingCardProps`~~ (dijadikan interface internal).
  - `components/bracket/BracketPairingCard.tsx`:
    - ~~L6: Interface `BracketPairingCardProps`~~ (dijadikan interface internal).
  - `components/bracket/BracketStatusAlert.tsx`:
    - ~~L4: Interface `BracketStatusAlertProps`~~ (dijadikan interface internal).
- ~~**admin/schedule**~~ (✅ Selesai dibersihkan):
  - ~~`lib/schedule/generateMatchSchedule.ts`: L24, L30, L34, L60 (tetap dipertahankan untuk pure engine schedule).~~
  - ~~`hooks/useScheduleManagement.ts`: L17, L19, L24: Type `UnscheduledWarningInfo` (dijadikan internal), `ScheduleGenerationMode`, `ScheduleToast`.~~
  - ~~`hooks/useScheduleQuery.ts`: L11, L14, L29: `CATEGORIES_WITH_GROUPS_QUERY_KEY`, `SchedulableCategoryItem`, `KnockoutReservationInfo` (dijadikan internal).~~
  - ~~`hooks/useKnockoutSchedule.ts`: L11, L25: `KNOCKOUT_SCHEDULE_QUERY_KEY`, `KnockoutScheduleData` (dijadikan internal).~~
- ~~**register**~~ (✅ Selesai dibersihkan):
  - ~~`hooks/useTeamRegistration.ts`: L10: Interface `UseTeamRegistrationReturn`.~~
  - ~~`lib/validations/team-registration.ts`: L7, L8, L58: `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`, `TeamRegistrationInput` (dijadikan internal konstanta/tipe).~~
- ~~**display**~~ (✅ Selesai dibersihkan):
  - `hooks/useCourtsOverviewQuery.ts`:
    - ~~L7: `COURTS_OVERVIEW_QUERY_KEY`~~ (dijadikan konstanta internal).
  - `hooks/useCategoryStandingsQuery.ts`:
    - ~~L8: `categoryStandingsQueryKey`~~ (dijadikan konstanta internal).
  - `hooks/useStandingsOverviewQuery.ts`:
    - ~~L9, L11: `STANDINGS_OVERVIEW_QUERY_KEY`, `GroupLeaderPreview`~~ (dijadikan internal).
- **Props interface lokal yang diekspor tanpa consumer luar**:
  - ~~`CategoryStandingsViewProps`, `CourtOverviewCardProps`, `StandingsOverviewCardProps`, `GroupStandingsTableProps`, `CourtLiveDisplayProps`~~ (dijadikan internal).

---

### 2. God Hooks

Berikut daftar custom hook yang menangani lebih dari 1 tanggung jawab dan rekomendasi pemecahannya:

| Nama Hook & File | Tanggung Jawab Tercampur | Rekomendasi Pemecahan |
| :--- | :--- | :--- |
| **`useTeamRegistration`**<br>`hooks/useTeamRegistration.ts` *(185 baris)* | 1. State form pendaftaran tim & validasi Zod<br>2. Upload handling (validasi mime, size, reading base64)<br>3. Server Action submit mutation<br>4. UI status & feedback notifikasi | Sesuai contoh panduan §K:<br>• `useTeamRegistrationForm`<br>• `usePaymentReceiptUpload`<br>• `useTeamRegistrationSubmit` |
| **`useScoringManagement`**<br>`hooks/useScoringManagement.ts` *(375 baris)* | 1. Identitas wasit & auth check via Supabase client<br>2. Court locking & heartbeat session (timer 30s, visibilitychange, unload listener)<br>3. Mutasi scoring (point, game, finish, undo)<br>4. Dialog & modal state (steal session, undo confirmation) | • `useScoringSession` (identitas, lock, heartbeat, steal)<br>• `useScoringMutations` (point, game, undo, finish)<br>• `useScoringModals` (dialog konfirmasi) |
| **`useTournamentSettingsForm`**<br>`hooks/useTournamentSettingsForm.ts` *(255 baris)* | 1. State form pengaturan turnamen & validasi Zod<br>2. State list court CRUD (tambah, hapus, edit nama court)<br>3. Form sync dari initial query<br>4. Mutasi ke 2 server action berbeda (`updateTournamentSettingsAction` & `updateCourtsAction`) | • `useTournamentSettingsForm`<br>• `useCourtsManager` |
| **`useScheduleManagement`**<br>`hooks/useScheduleManagement.ts` *(317 baris)* | 1. Filter tabs & kategori navigasi<br>2. Parameter form opsi generate jadwal<br>3. Kalkulasi warning unscheduled matches<br>4. Mutasi generate & clear schedule | • `useScheduleFilters`<br>• `useScheduleGenerationForm`<br>• `useScheduleMutations` |
| **`useKnockoutSchedule`**<br>`hooks/useKnockoutSchedule.ts` *(329 baris)* | 1. TanStack query data fetching & transformasi knockout pairings<br>2. Modal state & form slot penugasan court/waktu<br>3. Mutasi penjadwalan match knockout & unschedule | • `useKnockoutScheduleQuery`<br>• `useKnockoutScheduleFormModal`<br>• `useKnockoutScheduleMutations` |
| ~~**`useCategoriesManagement`**<br>`hooks/useCategoriesManagement.ts` *(236 baris)*~~ | ~~1. Modal open/close state<br>2. Category form state & auto-suggested name generation<br>3. Mutasi kategori (create, toggle active)~~ *(Catatan: update & delete ditiadakan sesuai ON DELETE RESTRICT & skema)* | ✅ **Selesai dipecah**:<br>• `useCategoryFormModal`<br>• `useCategoryMutations`<br>(composed via thin `useCategoriesManagement`) |
| ~~**`useBracketManagement`**<br>`hooks/useBracketManagement.ts` *(207 baris)*~~ | ~~1. Category selector state<br>2. Mutasi bracket (auto-generate semifinal/final, reset)~~ *(Catatan: modal pairing manual ditiadakan karena flow bisnis turnamen otomatis)* | ✅ **Selesai dipecah**:<br>• `useBracketMutations`<br>(composed via thin `useBracketManagement`) |
| ~~**`useTeamsManagement`**<br>`hooks/useTeamsManagement.ts` *(162 baris)*~~ | ~~1. Filter kategori dan status<br>2. Detail modal state untuk preview bukti transfer<br>3. Mutasi status tim (approve, reject)~~ *(Catatan: fitur delete team & search ditunda karena flow UI belum ditentukan)* | ✅ **Selesai dipecah**:<br>• `useTeamFilters` (kategori & status)<br>• `useTeamMutations` (approve & reject)<br>(composed via thin `useTeamsManagement`) |

---

### 3. Baris Terlalu Panjang (>100 Karakter)

Berikut daftar file dengan pelanggaran panjang baris terbanyak akibat JSX props inline dan ternary panjang:

| Nama File | Jumlah Baris >100 Karakter | Total Baris |
| :--- | :---: | :---: |
| `components/display/CourtLiveDisplay.tsx` | ~~68~~ ✅ Selesai di-wrap & dipecah | 240 |
| `components/schedule/KnockoutScheduleTab.tsx` | ~~56~~ ✅ Selesai di-wrap | 444 |
| `components/display/CourtOverviewCard.tsx` | ~~46~~ ✅ Selesai di-wrap | 334 |
| `components/schedule/ScheduleManagementView.tsx` | ~~44~~ ✅ Selesai di-wrap & dipecah | 198 |
| `components/scoring/LiveScoringBoard.tsx` | ~~38~~ ✅ Selesai di-wrap | 384 |
| `components/bracket/BracketManagementView.tsx` | ~~37~~ ✅ Selesai di-wrap | 438 |
| `components/display/StandingsOverviewGrid.tsx` | ~~36~~ ✅ Selesai di-wrap | 246 |
| `components/schedule/ScheduleGridView.tsx` | ~~33~~ ✅ Selesai di-wrap | 363 |
| `app/admin/(protected)/scoring/actions.ts` | ~~29~~ ✅ Selesai di-wrap | 651 |
| `components/scoring/CourtMatchList.tsx` | ~~28~~ ✅ Selesai di-wrap | 222 |
| `app/admin/(protected)/schedule/actions.ts` | ~~27~~ ✅ Selesai di-wrap | 727 |
| `components/display/CourtsOverviewGrid.tsx` | ~~27~~ ✅ Selesai di-wrap | 208 |
| `components/display/CategoryStandingsView.tsx` | ~~25~~ ✅ Selesai di-wrap | 250 |
| `components/categories/CategoriesManagementView.tsx` | **24** | 265 |
| `components/display/GroupStandingsTable.tsx` | ~~24~~ ✅ Selesai di-wrap | 211 |
| `components/categories/CategoryTable.tsx` | **21** | 294 |
| `components/schedule/SchedulePreviewCard.tsx` | ~~21~~ ✅ Selesai di-wrap | 289 |
| `components/teams/TeamDetailModal.tsx` | **20** | 226 |
| `components/tournament-setup/TournamentSetupView.tsx` | **18** | 232 |
| `hooks/useScoringManagement.ts` | **17** | 375 |
| `components/tournament-setup/ShareRegistrationCard.tsx` | **16** | 176 |
| `components/bracket/FinalPairingCard.tsx` | ~~15~~ ✅ Selesai di-wrap | 232 |
| `components/schedule/ScheduleRegenerateConfirmModal.tsx` | ~~15~~ ✅ Selesai di-wrap | 185 |
| `components/scoring/CourtSelectionView.tsx` | ~~14~~ ✅ Selesai di-wrap | 104 |
| `components/tournament-setup/TournamentSetupForm.tsx` | **14** | 260 |

---

### 4. Conditional Rendering yang Dapat Di-Object-kan

1. **Label & Judul Ronde Pertandingan (`round`)**:
   - Terduplikasi di 4 komponen:
     - ~~`components/scoring/CourtMatchList.tsx:L28`~~ ✅ Selesai di-refactor menggunakan `ROUND_LABELS` di `lib/scoring/constants.ts`
     - ~~`components/display/CourtLiveDisplay.tsx:L35`~~ ✅ Selesai di-refactor menggunakan `ROUND_LABELS` di `lib/scoring/constants.ts`
     - ~~`components/display/CourtOverviewCard.tsx:L36`~~ ✅ Selesai di-refactor menggunakan `ROUND_LABELS` di `lib/scoring/constants.ts`
     - ~~`components/scoring/LiveScoringBoard.tsx:L36`~~ ✅ Selesai di-refactor menggunakan `ROUND_LABELS` di `lib/scoring/constants.ts`
   - *Solusi refactor*: Buat record terpusat di `types/domain.ts` atau `lib/scoring/constants.ts`:
     ```ts
     export const ROUND_LABELS: Record<MatchRound, string> = {
       group: 'Penyisihan Grup',
       semifinal: 'Semifinal',
       final: 'Final',
       third_place: 'Perebutan Juara 3',
     }
     ```

2. **Status Badge Match (`live` / `scheduled` / `completed`)**:
   - ~~`components/scoring/CourtMatchList.tsx:L137-L160`~~: ✅ Selesai di-refactor menggunakan `MATCH_STATUS_CONFIG` lookup di `lib/scoring/constants.ts`.
   - ~~`components/schedule/KnockoutScheduleTab.tsx` & `ScheduleGridView.tsx`~~: ✅ Selesai di-refactor menggunakan `MATCH_STATUS_CONFIG` lookup di `lib/scoring/constants.ts`.
   - *Solusi refactor*: Buat lookup object:
     ```ts
     export const MATCH_STATUS_CONFIG: Record<MatchStatus, { badgeClass: string; label: string; icon: LucideIcon }> = {
       live: { badgeClass: '...', label: 'LIVE', icon: Zap },
       scheduled: { badgeClass: '...', label: 'SCHEDULED', icon: Clock },
       completed: { badgeClass: '...', label: 'SELESAI', icon: CheckCircle2 },
     }
     ```

3. **Status Badge Tournament Settings (`draft` / `registration_open` / `ongoing` / `completed`)**:
   - `components/tournament-setup/TournamentSetupForm.tsx:L25-L48`: ~~`switch (status)` panjang~~ ✅ Selesai di-refactor menggunakan `TOURNAMENT_STATUS_CONFIG` record lookup.
   - *Solusi refactor*: `const TOURNAMENT_STATUS_CONFIG: Record<TournamentStatus, { label: string; variant: BadgeVariant; description: string }>`.

4. **Format Level Kategori (`beginner` / `intermediate` / `advanced`)**:
   - `components/categories/CategoryTable.tsx:L45-L56`: ~~`switch (level)`~~ ✅ Selesai di-refactor menggunakan `CATEGORY_LEVEL_CONFIG` record lookup.
   - `components/display/CategoryStandingsView.tsx:L32-L41`: ~~`switch (level)`~~ ✅ Dihapus (dead code yang tidak pernah dipanggil).
   - *Solusi refactor*: `const CATEGORY_LEVEL_CONFIG: Record<CategoryLevel, { label: string; badgeVariant: BadgeVariant }>`.

---

### 5. Komentar Tidak Perlu (Self-explanatory)

Komentar yang hanya mengulang apa yang sudah jelas dari nama method/variable/fungsi tanpa memberi informasi "kenapa":

- ~~`app/register/page.tsx:L21`: `// Fetch kategori turnamen yang sedang aktif`~~ (✅ Dihapus).
- ~~`hooks/useTeamRegistration.ts`:~~ (✅ Dihapus)
  - ~~L41: `// Handler pemilihan file bukti transfer`~~
  - ~~L95: `// Handler submit formulir`~~
  - ~~L153: `// Reset formulir setelah pendaftaran berhasil`~~
- ~~`hooks/useCategoriesManagement.ts`:~~ (✅ Dihapus)
  - ~~L217: `// Modal`~~
  - ~~L221: `// Form`~~
- ~~`hooks/useDrawManagement.ts:L112`: `// Buka modal konfirmasi`~~ (✅ Dihapus).
- ~~`hooks/useTeamsManagement.ts:L98`: `// Update selected team status jika modal sedang terbuka`~~ (✅ Dihapus).
- ~~`hooks/useScoringManagement.ts:L365`: `// Handlers`~~ (✅ Dihapus).
- ~~`app/admin/(protected)/tournament-setup/page.tsx:L26`: `// Ambil data pengaturan turnamen yang aktif jika sudah ada (mode edit)`~~ (✅ Dihapus).
- ~~`app/admin/(protected)/bracket/actions.ts:L172`: `// Ambil data tim untuk pasangan nama pemain`~~ (✅ Dihapus).
- ~~`app/admin/(protected)/scoring/actions.ts:L343`: `// Ambil pengaturan golden point dari tournament_settings`~~ (✅ Dihapus).
- ~~`components/display/CourtsOverviewGrid.tsx`, `StandingsOverviewGrid.tsx`, `CategoryStandingsView.tsx`~~: Komentar seksi nomor berulang (`// 1. Data Query...`, `// 2. Realtime Subscription...`, `// 3. Jam Digital Broadcast...`) (✅ Dihapus).

---

## Rencana Aksi Pembersihan yang Direkomendasikan

1. **Fase 1 (Pembersihan Cepat / Quick Wins)**:
   - Bersihkan seluruh *unused import* dan *unused variable* di seluruh codebase (menyelesaikan warning ESLint).
   - Hapus *dead export* yang tidak pernah dipanggil (seperti `getScoreHistoryCountAction` di `scoring/actions.ts`).
2. **Fase 2 (Konfigurasi UI Deklaratif)**:
   - Definisikan `ROUND_LABELS`, `MATCH_STATUS_CONFIG`, `TOURNAMENT_STATUS_CONFIG`, dan `CATEGORY_LEVEL_CONFIG` sebagai record/object lookup terpusat.
   - Gantikan `switch` dan ternary bersarang pada komponen `CourtMatchList`, `CourtLiveDisplay`, `TournamentSetupForm`, dan `CategoryTable`.
3. **Fase 3 (Pecah God Hooks)**:
   - Mulai dari `useTeamRegistration` (terisolasi dan cocok sebagai baseline).
   - Lanjutkan ke `useTournamentSettingsForm`, `useScheduleManagement`, dan `useScoringManagement`.
4. **Fase 4 (Formatting & Wrap Line >100)**:
   - Pecah JSX props inline panjang menjadi multi-line.
   - Ekstrak kondisi ternary panjang ke variable deskriptif sebelum return JSX.