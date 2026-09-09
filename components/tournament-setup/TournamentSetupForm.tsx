import React from 'react'
import {
    TextInput,
    Switch,
    Button,
    Card,
} from '@/components/ui'
import { TournamentStatus } from '@/types/domain'
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

function renderStatusBadge(status?: TournamentStatus) {
    switch (status) {
        case 'ongoing':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-lime-400/15 border border-lime-400/30 text-lime-400 shadow-sm shadow-lime-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                    Turnamen Berlangsung
                </span>
            )
        case 'completed':
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-950 border border-emerald-700 text-emerald-300">
                    Selesai
                </span>
            )
        case 'draw_done':
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-400">
                    Drawing Selesai
                </span>
            )
        case 'draft':
        default:
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-400">
                    Draft (Pendaftaran)
                </span>
            )
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
            <Card className="p-6 sm:p-8 space-y-6 bg-emerald-900/70 border border-emerald-800 rounded-xl shadow-xl shadow-emerald-950/60 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800">
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight uppercase">
                            {isEditMode ? 'Edit Konfigurasi Turnamen' : 'Buat Turnamen Baru'}
                        </h2>
                        <p className="text-xs text-emerald-300/90 mt-1">
                            Tentukan format fase grup, jumlah lapangan, dan aturan scoring turnamen.
                        </p>
                    </div>
                    {isEditMode && currentStatus && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-300/80">Status:</span>
                            {renderStatusBadge(currentStatus)}
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
                    containerClassName="[&>label]:!text-emerald-300 [&>p]:!text-emerald-400/80"
                    className="!bg-emerald-950/80 !border-emerald-800 !text-white placeholder:!text-emerald-400/40 focus:!border-lime-400 focus:!ring-2 focus:!ring-lime-400/20"
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
                        containerClassName="[&>label]:!text-emerald-300 [&>p]:!text-emerald-400/80"
                        className="!bg-emerald-950/80 !border-emerald-800 !text-white placeholder:!text-emerald-400/40 focus:!border-lime-400 focus:!ring-2 focus:!ring-lime-400/20"
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
                        containerClassName="[&>label]:!text-emerald-300 [&>p]:!text-emerald-400/80"
                        className="!bg-emerald-950/80 !border-emerald-800 !text-white placeholder:!text-emerald-400/40 focus:!border-lime-400 focus:!ring-2 focus:!ring-lime-400/20"
                    />
                </div>

                <div className="pt-5 border-t border-emerald-800 space-y-5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-lime-400">
                        Aturan &amp; Format Pertandingan
                    </h3>

                    {/* Field 4: Toggle Golden Point */}
                    <div className="rounded-xl p-4 bg-emerald-950/70 border border-emerald-800 transition-all hover:border-emerald-700">
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
                    <div className="rounded-xl p-4 bg-emerald-950/70 border border-emerald-800 transition-all hover:border-emerald-700">
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
                <div className="pt-4 border-t border-emerald-800 flex items-center justify-end gap-3">
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-emerald-950 font-black tracking-wide shadow-lg shadow-lime-400/20 active:scale-[0.99] transition-all cursor-pointer"
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
