import React from 'react'
import {
    TextInput,
    Switch,
    Button,
    Card,
    Badge,
} from '@/components/ui'
import { TournamentStatus } from '@/types/domain'
import { TournamentFormValues } from '@/hooks/useTournamentSettingsForm'

interface TournamentSetupFormProps {
    values: TournamentFormValues
    fieldErrors: Record<string, string>
    isSubmitting: boolean
    isEditMode: boolean
    currentStatus?: TournamentStatus
    onFieldChange: <K extends keyof TournamentFormValues>(
        field: K,
        val: TournamentFormValues[K]
    ) => void
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral'

const TOURNAMENT_STATUS_CONFIG: Record<
    TournamentStatus,
    { label: string; variant: BadgeVariant; description: string }
> = {
    draft: {
        label: 'Draft (Pendaftaran)',
        variant: 'neutral',
        description: 'Konfigurasi turnamen masih dalam tahap draf dan dapat disesuaikan.',
    },
    draw_done: {
        label: 'Drawing Selesai',
        variant: 'warning',
        description: 'Drawing grup telah selesai dilakukan.',
    },
    ongoing: {
        label: 'Turnamen Berlangsung',
        variant: 'success',
        description: 'Pertandingan turnamen sedang berlangsung.',
    },
    completed: {
        label: 'Selesai',
        variant: 'neutral',
        description: 'Seluruh pertandingan turnamen telah selesai.',
    },
}

function renderStatusBadge(status?: TournamentStatus) {
    const config = TOURNAMENT_STATUS_CONFIG[status || 'draft']
    return (
        <Badge variant={config.variant} size="sm">
            {status === 'ongoing' && (
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            )}
            {config.label}
        </Badge>
    )
}

/**
 * TournamentSetupForm
 * Presentational dumb component untuk formulir konfigurasi turnamen.
 * Mematuhi docs/component-architecture.md §A & §B.
 */
export function TournamentSetupForm({
    values,
    fieldErrors,
    isSubmitting,
    isEditMode,
    currentStatus,
    onFieldChange,
    onSubmit,
}: TournamentSetupFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <Card
                className="p-6 sm:p-8 space-y-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-xl text-white"
            >
                <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800"
                >
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight uppercase">
                            {isEditMode ? 'Edit Konfigurasi Turnamen' : 'Buat Turnamen Baru'}
                        </h2>
                        <p className="text-xs text-zinc-400 mt-1">
                            Tentukan format fase grup, jumlah lapangan, dan aturan scoring turnamen.
                        </p>
                    </div>
                    {isEditMode && currentStatus && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">Status:</span>
                            {renderStatusBadge(currentStatus)}
                        </div>
                    )}
                </div>

                {/* Section 1: Informasi Publik Turnamen */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-lime-400">
                        Informasi Publik Turnamen
                    </h3>

                    {/* Field 1: Nama Turnamen */}
                    <TextInput
                        id="tournament-name"
                        name="name"
                        label="Nama Turnamen"
                        required
                        placeholder="Contoh: Jakarta Padel Open 2026"
                        value={values.name}
                        error={fieldErrors.name}
                        helperText="Nama resmi turnamen yang akan tampil pada banner display dan pendaftaran."
                        onChange={(e) => onFieldChange('name', e.target.value)}
                        disabled={isSubmitting}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                        <TextInput
                            id="event-date"
                            name="event_date"
                            type="date"
                            label="Tanggal Pelaksanaan"
                            value={values.event_date}
                            error={fieldErrors.event_date}
                            helperText="Opsional: Tanggal pelaksanaan turnamen."
                            onChange={(e) => onFieldChange('event_date', e.target.value)}
                            disabled={isSubmitting}
                        />
                        <TextInput
                            id="venue-name"
                            name="venue_name"
                            label="Nama Venue / Lokasi"
                            placeholder="Contoh: Padel Club Jakarta"
                            value={values.venue_name}
                            error={fieldErrors.venue_name}
                            helperText="Opsional: Nama tempat turnamen berlangsung."
                            onChange={(e) => onFieldChange('venue_name', e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <TextInput
                        id="venue-address"
                        name="venue_address"
                        label="Alamat Venue Lengkap"
                        placeholder="Contoh: Jl. Sudirman No. 123, Jakarta"
                        value={values.venue_address}
                        error={fieldErrors.venue_address}
                        helperText="Opsional: Alamat lengkap tempat turnamen."
                        onChange={(e) => onFieldChange('venue_address', e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                {/* Section 2: Format Turnamen & Lapangan */}
                <div className="pt-5 border-t border-zinc-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-lime-400">
                        Format Turnamen &amp; Lapangan
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Field 2: Tim per Grup */}
                        <TextInput
                            id="team-per-group"
                            name="team_per_group"
                            type="number"
                            label="Jumlah Tim per Grup"
                            required
                            min={2}
                            max={16}
                            value={values.team_per_group}
                            error={fieldErrors.team_per_group}
                            helperText="Standar format round robin adalah 4 tim per grup."
                            onChange={(e) =>
                                onFieldChange(
                                    'team_per_group',
                                    parseInt(e.target.value, 10) || 0
                                )
                            }
                            disabled={isSubmitting}
                        />

                        {/* Field 3: Jumlah Lapangan / Court */}
                        <TextInput
                            id="number-of-courts"
                            name="number_of_courts"
                            type="number"
                            label="Jumlah Court / Lapangan"
                            required
                            min={1}
                            max={30}
                            value={values.number_of_courts}
                            error={fieldErrors.number_of_courts}
                            helperText="Jumlah court aktif untuk penjadwalan match & tampilan layar TV."
                            onChange={(e) =>
                                onFieldChange(
                                    'number_of_courts',
                                    parseInt(e.target.value, 10) || 0
                                )
                            }
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Section Baru: Jadwal & Waktu Pertandingan */}
                <div className="pt-5 border-t border-zinc-800 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-lime-400">
                        Jadwal &amp; Waktu Pertandingan
                    </h3>

                    {/* Estimasi Durasi Pertandingan (menit) */}
                    <TextInput
                        id="match-duration"
                        name="match_duration_minutes"
                        type="number"
                        label="Estimasi Durasi Pertandingan (Menit)"
                        required
                        min={10}
                        max={240}
                        value={values.match_duration_minutes}
                        error={fieldErrors.match_duration_minutes}
                        helperText="Alokasi estimasi durasi per match (termasuk jeda/pemanasan) untuk generate jadwal otomatis."
                        onChange={(e) =>
                            onFieldChange(
                                'match_duration_minutes',
                                parseInt(e.target.value, 10) || 0
                            )
                        }
                        disabled={isSubmitting}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                        {/* Jam Mulai Turnamen */}
                        <TextInput
                            id="daily-start-time"
                            name="daily_start_time"
                            type="time"
                            label="Jam Mulai Turnamen"
                            required
                            value={values.daily_start_time}
                            error={fieldErrors.daily_start_time}
                            helperText="Waktu dimulainya slot pertandingan pertama setiap hari."
                            onChange={(e) => onFieldChange('daily_start_time', e.target.value)}
                            disabled={isSubmitting}
                        />

                        {/* Jam Selesai Turnamen */}
                        <TextInput
                            id="daily-end-time"
                            name="daily_end_time"
                            type="time"
                            label="Jam Selesai Turnamen"
                            required
                            value={values.daily_end_time}
                            error={fieldErrors.daily_end_time}
                            helperText="Batas akhir penggunaan court turnamen setiap hari."
                            onChange={(e) => onFieldChange('daily_end_time', e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="pt-5 border-t border-zinc-800 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-lime-400">
                        Aturan &amp; Format Pertandingan
                    </h3>

                    {/* Field 4: Toggle Golden Point */}
                    <div
                        className="rounded-xl p-4 bg-zinc-950/70 border border-zinc-800 transition-all hover:border-zinc-700"
                    >
                        <Switch
                            id="golden-point-enabled"
                            name="golden_point_enabled"
                            checked={values.golden_point_enabled}
                            onChange={(checked) => onFieldChange('golden_point_enabled', checked)}
                            label="Aktifkan Aturan Golden Point (Deciding Point)"
                            description="Saat deuce (40-40), tim yang memenangkan poin berikutnya langsung memenangkan game tanpa sistem advantage."
                            error={fieldErrors.golden_point_enabled}
                            disabled={isSubmitting}
                            className={values.golden_point_enabled ? '!bg-lime-400' : '!bg-zinc-800'}
                        />
                    </div>

                    {/* Field 5: Toggle Perebutan Juara 3 */}
                    <div
                        className="rounded-xl p-4 bg-zinc-950/70 border border-zinc-800 transition-all hover:border-zinc-700"
                    >
                        <Switch
                            id="third-place-enabled"
                            name="third_place_enabled"
                            checked={values.third_place_enabled}
                            onChange={(checked) => onFieldChange('third_place_enabled', checked)}
                            label="Pertandingan Perebutan Juara 3"
                            description="Jadwalkan pertandingan tambahan antara 2 tim yang kalah di babak semifinal sebelum babak final dimulai."
                            error={fieldErrors.third_place_enabled}
                            disabled={isSubmitting}
                            className={values.third_place_enabled ? '!bg-lime-400' : '!bg-zinc-800'}
                        />
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl !bg-lime-400 hover:!bg-lime-300 !text-zinc-950 !font-black tracking-wide shadow-lg shadow-lime-400/20 active:scale-[0.99] transition-all cursor-pointer"
                    >
                        {isSubmitting
                            ? 'Menyimpan...'
                            : isEditMode
                            ? 'Perbarui Pengaturan'
                            : 'Simpan & Buat Turnamen'}
                    </Button>
                </div>
            </Card>
        </form>
    )
}
