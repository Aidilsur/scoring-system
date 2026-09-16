# Laporan Audit Clean Code Standards (§K)

Dokumen ini berisi hasil audit komprehensif terhadap seluruh codebase Padel Tournament Scoring System berdasarkan aturan di `docs/component-architecture.md` (§K - Clean Code Standards).

---

## Ringkasan Matriks Prioritas per Modul

Daftar modul diurutkan berdasarkan tingkat urgensi dan jumlah pelanggaran terbanyak:

| Prioritas | Modul | Dead Code | God Hooks | Baris >100 Karakter | Refactor Record Lookup | Komentar Redundant |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **P1** | **`admin/schedule`** | 18 temuan | 2 hooks (`useScheduleManagement`, `useKnockoutSchedule`) | **226 baris** (7 file) | Status match badge (Grid & Knockout) | 2 |
| **P2** | **`display`** | 14 temuan | 1 hook (`useCourtLiveDisplay`) | **232 baris** (6 file) | `getRoundLabel` & `formatLevel` | 3 |
| **P3** | **`admin/scoring`** | 12 temuan (termasuk action `getScoreHistoryCountAction`) | 1 hook (`useScoringManagement` 375 baris) | **132 baris** | Status badge & `getRoundTitle` | 2 |
| **P4** | **`admin/bracket`** | 8 temuan | 1 hook (`useBracketManagement`) | **68 baris** | - | 1 |
| **P5** | **`admin/tournament-setup`** | 6 temuan | 1 hook (`useTournamentSettingsForm`) | **62 baris** | `TOURNAMENT_STATUS_CONFIG` | 1 |
| **P6** | **`admin/categories`** | 4 temuan | 1 hook (`useCategoriesManagement`) | **53 baris** | `CATEGORY_LEVEL_CONFIG` | 2 |
| **P7** | **`register`** | 4 temuan | 1 hook (`useTeamRegistration`) | **13 baris** | - | 3 |
| **P8** | **`admin/teams`** | ~~2 temuan~~ ✅ Selesai dibersihkan | 1 hook (`useTeamsManagement`) | ~~38 baris~~ ✅ 0 baris | - | ~~1~~ ✅ Dihapus |
| **P9** | **`admin/draw`** | ~~10 temuan~~ ✅ Selesai dibersihkan | Relatif bersih | ~~37 baris~~ ✅ 0 baris | - | ~~1~~ ✅ Dihapus |

---

## Bagian 1: Temuan Detail Berdasarkan 5 Kategori §K

### 1. Dead Code

#### A. Unused Imports & Variables
- **admin/schedule**:
  - `components/schedule/ScheduleGridView.tsx`:
    - L4-L5: Import `Users`, `CheckCircle2`, `Play`, `AlertCircle`, `Badge` tidak pernah digunakan.
    - L77-L79: Variable `startTime`, `endTime`, `durationMinutes` di-destructure tapi tidak dipakai.
  - `components/schedule/ScheduleManagementView.tsx`:
    - L86: Variable `unscheduledWarning` dihitung tapi tidak dipakai.
  - `components/schedule/SchedulePreviewCard.tsx`:
    - L5, L11: Import `Calendar` dan `Play` tidak pernah dipakai.
  - `components/schedule/ScheduleWarningCard.tsx`:
    - L4: Import `Clock`, `PlusCircle`, `Sliders` tidak terpakai.
  - `components/schedule/KnockoutScheduleTab.tsx`:
    - L17: Import `KnockoutRoundItem` tidak terpakai.
  - `hooks/useKnockoutSchedule.ts`:
    - L8: Import type `MatchRound` tidak terpakai.
  - `hooks/useScheduleQuery.ts`:
    - L108: Variable `categoryIds` di-assign tapi tidak terpakai.
- **admin/scoring**:
  - `components/scoring/CourtMatchList.tsx`:
    - L4: Import `AlertCircle` tidak terpakai.
  - `components/scoring/CourtSelectionView.tsx`:
    - L6, L14: Import `Button` dan prop `userEmail` tidak terpakai.
  - `components/scoring/LiveScoringBoard.tsx`:
    - L11, L77: Import `Zap` dan variable `isKnockoutGoldenGame` tidak terpakai.
  - `app/admin/(protected)/scoring/[courtId]/page.tsx`:
    - L14: Param `courtId` di-destructure tapi tidak dipakai.
  - `app/admin/(protected)/scoring/[courtId]/[matchId]/page.tsx`:
    - L14: Param `matchId` di-destructure tapi tidak dipakai.
  - `app/admin/(protected)/scoring/actions.ts`:
    - L39, L127, L169, L255, L526: Parameter `_userIdentifier` tidak digunakan dalam body fungsi.
- **admin/bracket**:
  - `components/bracket/BracketManagementView.tsx`:
    - L8, L11: Import `Play`, `Info` tidak terpakai.
    - L32, L33: Query state `isCategoriesError` dan `categoriesError` tidak dipakai.
  - `hooks/useBracketManagement.ts`:
    - L9: Variable `BRACKET_CATEGORIES_QUERY_KEY` tidak terpakai.
- **display**:
  - `components/display/CategoryStandingsView.tsx`:
    - L25, L31: Fungsi `formatPartnerType` dan `formatLevel` dideklarasikan lokal tapi tidak pernah dipanggil.
  - `components/display/CourtLiveDisplay.tsx`:
    - L16: Import type `Match` tidak terpakai.
  - `components/display/CourtOverviewCard.tsx`:
    - L9: Import `Maximize2` tidak terpakai.
  - `components/display/CourtsOverviewGrid.tsx`:
    - L10, L16: Import `Calendar` dan `Badge` tidak terpakai.
  - `components/display/StandingsOverviewCard.tsx`:
    - L12: Import `Calendar` tidak terpakai.
  - `components/display/StandingsOverviewGrid.tsx`:
    - L16: Import `Badge` tidak terpakai.
  - `hooks/useCourtLiveDisplay.ts`:
    - L62: Variable `matches` dari query result tidak terpakai.
- **admin/tournament-setup**:
  - `hooks/useTournamentSettingsForm.ts`:
    - L7: Import type `TournamentSettingsInput` tidak terpakai.

#### B. Unused Exported Functions & Types (Export tanpa consumer luar)
- **admin/scoring**:
  - `app/admin/(protected)/scoring/actions.ts`:
    - L635: `export async function getScoreHistoryCountAction(...)` (Server action tidak pernah dipanggil di hook/komponen).
    - L16, L22: Type `ScoringActionResponse`, `SessionClaimResponse`.
  - `hooks/useMatchDetailQuery.ts`:
    - L10: `export const matchHistoryCountQueryKey`.
  - `components/scoring/ScoringView.tsx`:
    - L20: Duplikasi ekspor `export function ScoringView` (sudah ada `export default ScoringView`).
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
- **admin/schedule**:
  - `lib/schedule/generateMatchSchedule.ts`:
    - L24, L30, L34, L60: Type `ScheduledMatchItem`, `UnscheduledMatchItem`, `ScheduleResult`, `GenerateScheduleOptions`.
  - `hooks/useScheduleManagement.ts`:
    - L17, L19, L24: Type `ScheduleGenerationMode`, `ScheduleToast`, `UnscheduledWarningInfo`.
  - `hooks/useScheduleQuery.ts`:
    - L11, L14, L29: `CATEGORIES_WITH_GROUPS_QUERY_KEY`, `SchedulableCategoryItem`, `KnockoutReservationInfo`.
  - `hooks/useKnockoutSchedule.ts`:
    - L11, L25: `KNOCKOUT_SCHEDULE_QUERY_KEY`, `KnockoutScheduleData`.
- **register**:
  - `hooks/useTeamRegistration.ts`:
    - L10: Interface `UseTeamRegistrationReturn`.
  - `lib/validations/team-registration.ts`:
    - L7, L8: `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`.
- **display**:
  - `hooks/useCourtsOverviewQuery.ts`:
    - L7: `COURTS_OVERVIEW_QUERY_KEY`.
  - `hooks/useCategoryStandingsQuery.ts`:
    - L8: `categoryStandingsQueryKey`.
  - `hooks/useStandingsOverviewQuery.ts`:
    - L9, L11: `STANDINGS_OVERVIEW_QUERY_KEY`, `GroupLeaderPreview`.
- **Props interface lokal yang diekspor tanpa consumer luar**:
  - `BracketManagementViewProps`, `CategoryTableProps`, `CourtLiveDisplayProps`, `ScheduleManagementViewProps`, dll.

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
| **`useCategoriesManagement`**<br>`hooks/useCategoriesManagement.ts` *(236 baris)* | 1. Modal open/close & edit mode state<br>2. Category form state & auto-suggested name generation<br>3. 4 mutasi CRUD terpisah (create, update, toggle active, delete) | • `useCategoryFormModal`<br>• `useCategoryMutations` |
| **`useBracketManagement`**<br>`hooks/useBracketManagement.ts` *(207 baris)* | 1. Category selector state<br>2. Modal pairing assignment form (tim 1 & tim 2)<br>3. Mutasi bracket (auto-generate, update single pairing, reset) | • `useBracketPairingModal`<br>• `useBracketMutations` |
| **`useTeamsManagement`**<br>`hooks/useTeamsManagement.ts` *(162 baris)* | 1. Filter kategori, status, dan search term<br>2. Detail modal state untuk preview bukti transfer<br>3. Mutasi status tim (approve, reject, bayar) & delete tim | • `useTeamFilters`<br>• `useTeamMutations` |

---

### 3. Baris Terlalu Panjang (>100 Karakter)

Berikut daftar file dengan pelanggaran panjang baris terbanyak akibat JSX props inline dan ternary panjang:

| Nama File | Jumlah Baris >100 Karakter | Total Baris |
| :--- | :---: | :---: |
| `components/display/CourtLiveDisplay.tsx` | **68** | 440 |
| `components/schedule/KnockoutScheduleTab.tsx` | **56** | 359 |
| `components/display/CourtOverviewCard.tsx` | **46** | 334 |
| `components/schedule/ScheduleManagementView.tsx` | **44** | 439 |
| `components/scoring/LiveScoringBoard.tsx` | **38** | 384 |
| `components/bracket/BracketManagementView.tsx` | **37** | 401 |
| `components/display/StandingsOverviewGrid.tsx` | **36** | 246 |
| `components/schedule/ScheduleGridView.tsx` | **33** | 323 |
| `app/admin/(protected)/scoring/actions.ts` | **29** | 651 |
| `components/scoring/CourtMatchList.tsx` | **28** | 222 |
| `app/admin/(protected)/schedule/actions.ts` | **27** | 717 |
| `components/display/CourtsOverviewGrid.tsx` | **27** | 208 |
| `components/display/CategoryStandingsView.tsx` | **25** | 250 |
| `components/categories/CategoriesManagementView.tsx` | **24** | 265 |
| `components/display/GroupStandingsTable.tsx` | **24** | 211 |
| `components/categories/CategoryTable.tsx` | **21** | 294 |
| `components/schedule/SchedulePreviewCard.tsx` | **21** | 257 |
| `components/teams/TeamDetailModal.tsx` | **20** | 226 |
| `components/tournament-setup/TournamentSetupView.tsx` | **18** | 232 |
| `hooks/useScoringManagement.ts` | **17** | 375 |
| `components/tournament-setup/ShareRegistrationCard.tsx` | **16** | 176 |
| `components/bracket/FinalPairingCard.tsx` | **15** | 204 |
| `components/schedule/ScheduleRegenerateConfirmModal.tsx` | **15** | 157 |
| `components/scoring/CourtSelectionView.tsx` | **14** | 104 |
| `components/tournament-setup/TournamentSetupForm.tsx` | **14** | 260 |

---

### 4. Conditional Rendering yang Dapat Di-Object-kan

1. **Label & Judul Ronde Pertandingan (`round`)**:
   - Terduplikasi di 4 komponen:
     - `components/scoring/CourtMatchList.tsx:L28`
     - `components/display/CourtLiveDisplay.tsx:L35`
     - `components/display/CourtOverviewCard.tsx:L36`
     - `components/scoring/LiveScoringBoard.tsx:L36`
   - *Solusi refactor*: Buat record terpusat di `types/domain.ts` atau `lib/scoring/constants.ts`:
     ```ts
     export const ROUND_LABELS: Record<MatchRound, string> = {
       group: 'Penyisihan Grup',
       semifinal: 'Semifinal',
       final: 'Final',
     }
     ```

2. **Status Badge Match (`live` / `scheduled` / `completed`)**:
   - `components/scoring/CourtMatchList.tsx:L137-L160`: Ternary bersarang untuk background + `isLive && ...` `isScheduled && ...` `isCompleted && ...`.
   - `components/schedule/KnockoutScheduleTab.tsx:L233-L245`: Ternary `match.status === 'live' ? ... : match.status === 'completed' ? ... : ...`.
   - `components/schedule/ScheduleGridView.tsx:L253-L265`: Pola ternary status serupa.
   - *Solusi refactor*: Buat lookup object:
     ```ts
     export const MATCH_STATUS_CONFIG: Record<MatchStatus, { badgeClass: string; label: string; icon: LucideIcon }> = {
       live: { badgeClass: '...', label: 'LIVE', icon: Zap },
       scheduled: { badgeClass: '...', label: 'SCHEDULED', icon: Clock },
       completed: { badgeClass: '...', label: 'SELESAI', icon: CheckCircle2 },
     }
     ```

3. **Status Badge Tournament Settings (`draft` / `registration_open` / `ongoing` / `completed`)**:
   - `components/tournament-setup/TournamentSetupForm.tsx:L25-L48`: `switch (status)` panjang untuk menentukan text label, badge color, dan sub-keterangan.
   - *Solusi refactor*: `const TOURNAMENT_STATUS_CONFIG: Record<TournamentStatus, { label: string; variant: BadgeVariant; description: string }>`.

4. **Format Level Kategori (`beginner` / `intermediate` / `advanced`)**:
   - `components/categories/CategoryTable.tsx:L45-L56`: `switch (level)`.
   - `components/display/CategoryStandingsView.tsx:L32-L41`: `switch (level)`.
   - *Solusi refactor*: `const CATEGORY_LEVEL_CONFIG: Record<CategoryLevel, { label: string; badgeVariant: BadgeVariant }>`.

---

### 5. Komentar Tidak Perlu (Self-explanatory)

Komentar yang hanya mengulang apa yang sudah jelas dari nama method/variable/fungsi tanpa memberi informasi "kenapa":

- `app/register/page.tsx:L21`: `// Fetch kategori turnamen yang sedang aktif` (tepat sebelum `supabase.from('categories').select(...)`).
- `hooks/useTeamRegistration.ts`:
  - L41: `// Handler pemilihan file bukti transfer` (tepat sebelum `handleFileChange`)
  - L95: `// Handler submit formulir` (tepat sebelum `handleSubmit`)
  - L153: `// Reset formulir setelah pendaftaran berhasil` (tepat sebelum `setValues(INITIAL_VALUES)`)
- `hooks/useCategoriesManagement.ts`:
  - L217: `// Modal`
  - L221: `// Form`
- ~~`hooks/useDrawManagement.ts:L112`: `// Buka modal konfirmasi`~~ (✅ Dihapus).
- ~~`hooks/useTeamsManagement.ts:L98`: `// Update selected team status jika modal sedang terbuka`~~ (✅ Dihapus).
- `hooks/useScoringManagement.ts:L365`: `// Handlers` (tepat sebelum return object `selectCourt, ...`).
- `app/admin/(protected)/tournament-setup/page.tsx:L26`: `// Ambil data pengaturan turnamen yang aktif jika sudah ada (mode edit)`.
- `app/admin/(protected)/bracket/actions.ts:L172`: `// Ambil data tim untuk pasangan nama pemain`.
- `app/admin/(protected)/scoring/actions.ts:L343`: `// Ambil pengaturan golden point dari tournament_settings`.

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