import React from 'react'
import {
    TextInput,
    Switch,
    Button,
    Card,
    Badge,
} from '@/components/ui'
import { TournamentSettings, TournamentStatus } from '@/types/domain'
import { TournamentFormValues } from '@/hooks/useTournamentSettingsForm'

export interface TournamentSetupFormProps {
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

function getStatusBadgeVariant(status?: TournamentStatus): 'neutral' | 'success' | 'warning' {
    switch (status) {
        case 'draft':
            return 'neutral'
        case 'draw_done':
            return 'neutral'
        case 'ongoing':
            return 'warning'
        case 'completed':
            return 'success'
        default:
            return 'neutral'
    }
}

function getStatusLabel(status?: TournamentStatus): string {
    switch (status) {
        case 'draft':
            return 'Draft (Pendaftaran)'
        case 'draw_done':
            return 'Drawing Selesai'
        case 'ongoing':
            return 'Turnamen Berlangsung'
        case 'completed':
            return 'Selesai'
        default:
            return 'Baru'
    }
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
            <Card className="p-6 sm:p-8 space-y-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                            {isEditMode ? 'Edit Konfigurasi Turnamen' : 'Buat Turnamen Baru'}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Tentukan format fase grup, jumlah lapangan, dan aturan scoring turnamen.
                        </p>
                    </div>
                    {isEditMode && currentStatus && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">Status:</span>
                            <Badge variant={getStatusBadgeVariant(currentStatus)}>
                                {getStatusLabel(currentStatus)}
                            </Badge>
                        </div>
                    )}
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
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

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Aturan &amp; Format Pertandingan
                    </h3>

                    {/* Field 4: Toggle Golden Point */}
                    <div className="rounded-xl p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 transition">
                        <Switch
                            id="golden-point-enabled"
                            name="golden_point_enabled"
                            checked={values.golden_point_enabled}
                            onChange={(checked) => onFieldChange('golden_point_enabled', checked)}
                            label="Aktifkan Aturan Golden Point (Deciding Point)"
                            description="Saat deuce (40-40), tim yang memenangkan poin berikutnya langsung memenangkan game tanpa sistem advantage."
                            error={fieldErrors.golden_point_enabled}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Field 5: Toggle Perebutan Juara 3 */}
                    <div className="rounded-xl p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 transition">
                        <Switch
                            id="third-place-enabled"
                            name="third_place_enabled"
                            checked={values.third_place_enabled}
                            onChange={(checked) => onFieldChange('third_place_enabled', checked)}
                            label="Pertandingan Perebutan Juara 3"
                            description="Jadwalkan pertandingan tambahan antara 2 tim yang kalah di babak semifinal sebelum babak final dimulai."
                            error={fieldErrors.third_place_enabled}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        className="w-full sm:w-auto px-8"
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
