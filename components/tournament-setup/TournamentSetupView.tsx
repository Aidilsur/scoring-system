'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, X, Info, ArrowLeft } from 'lucide-react'
import { useTournamentSettingsForm } from '@/hooks/useTournamentSettingsForm'
import { TournamentSetupForm } from './TournamentSetupForm'
import { ShareRegistrationCard } from './ShareRegistrationCard'
import { Card, Button } from '@/components/ui'
import { TournamentSettings } from '@/types/domain'
import { cn } from '@/lib/utils'

interface TournamentSetupViewProps {
    initialData?: TournamentSettings | null
}

const TOURNAMENT_SETTING_HINTS = [
    {
        label: 'Nama Turnamen',
        description: 'Judul kegiatan yang tertera pada public scoreboard display & pendaftaran.',
    },
    {
        label: 'Ukuran Grup',
        description: 'Menentukan jumlah tim pada tiap grup saat drawing (standar 4 tim per grup).',
    },
    {
        label: 'Golden Point',
        description: 'Aturan deuce padel modern tanpa advantage, mempercepat ritme turnamen.',
    },
    {
        label: 'Jumlah Court',
        description: 'Sistem otomatis menyiapkan slot lapangan (Court 1, 2, dst) untuk pembagian jadwal.',
    },
    {
        label: 'Perebutan Juara 3',
        description: 'Menambahkan bagan tanding untuk runner-up semifinal sebelum final.',
    },
    {
        label: 'Durasi Match',
        description: 'Alokasi waktu per match untuk menyusun jadwal otomatis.',
    },
    {
        label: 'Jam Turnamen',
        description: 'Rentang jam operasional harian untuk slot giliran main.',
    },
] as const

const RELATED_MODULES = [
    {
        title: 'Drawing Grup (/admin/draw)',
        description: 'Buka setelah verifikasi peserta selesai untuk mengundi grup.',
    },
    {
        title: 'Jadwal Pertandingan (/admin/schedule)',
        description: 'Menentukan urutan main per court berdasarkan lapangan aktif.',
    },
] as const

/**
 * TournamentSetupView
 * Container component yang menghubungkan hook useTournamentSettingsForm ke presentational components.
 * Mematuhi docs/component-architecture.md §B & §G.
 */
export function TournamentSetupView({ initialData }: TournamentSetupViewProps) {
    const {
        settings,
        isEditMode,
        values,
        fieldErrors,
        feedback,
        clearFeedback,
        isSubmitting,
        isQueryLoading,
        isQueryError,
        queryError,
        refetch,
        setFieldValue,
        handleSubmit,
    } = useTournamentSettingsForm(initialData)

    return (
        <div className="space-y-6">
            {/* Top Navigation & Header */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800"
            >
                <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                        <Link href="/admin" className="hover:text-lime-400 transition-colors">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-200 font-medium">
                            Setup Turnamen
                        </span>
                    </div>
                    <h1
                        className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight"
                    >
                        Konfigurasi Turnamen
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                        Kelola parameter turnamen, format pertandingan grup, jumlah lapangan, dan aturan scoring.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/admin">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5 text-lime-400" />
                            Kembali ke Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Alert / Feedback Notification */}
            {feedback && (
                <div
                    className={cn(
                        'p-4 rounded-xl text-sm flex items-start justify-between gap-3 transition shadow-lg bg-zinc-900 shadow-black/40',
                        feedback.type === 'success'
                            ? 'border border-lime-400/50 text-lime-300'
                            : 'border border-red-500/50 text-red-200'
                    )}
                >
                    <div className="flex items-center gap-2.5">
                        {feedback.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        )}
                        <span className="font-semibold">{feedback.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={clearFeedback}
                        className="text-xs opacity-70 hover:opacity-100 transition p-1 cursor-pointer"
                        aria-label="Tutup pemberitahuan"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Query Error State */}
            {isQueryError && (
                <div
                    className="p-4 rounded-xl bg-zinc-900 border border-red-500/50 text-red-200 text-sm flex items-center justify-between shadow-lg"
                >
                    <div>Gagal memuat pengaturan: {queryError?.message}</div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => refetch()}
                        className="bg-red-900/60 hover:bg-red-800 text-white border border-red-700/60 rounded-xl"
                    >
                        Coba Lagi
                    </Button>
                </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form & Share Column */}
                <div className="lg:col-span-2 space-y-6">
                    {isQueryLoading && !settings ? (
                        <Card
                            className="p-12 text-center bg-zinc-900/70 border border-zinc-800 rounded-2xl"
                        >
                            <div
                                className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-lime-400 border-t-transparent mb-3"
                            />
                            <p className="text-sm text-zinc-400 font-medium">Memuat konfigurasi turnamen...</p>
                        </Card>
                    ) : (
                        <>
                            <TournamentSetupForm
                                values={values}
                                fieldErrors={fieldErrors}
                                isSubmitting={isSubmitting}
                                isEditMode={isEditMode}
                                currentStatus={settings?.status}
                                onFieldChange={setFieldValue}
                                onSubmit={handleSubmit}
                            />

                            {/* Section: Bagikan Pendaftaran */}
                            <ShareRegistrationCard
                                tournamentName={values.name || settings?.name}
                            />
                        </>
                    )}
                </div>

                {/* Information / Guidelines Sidebar */}
                <div className="space-y-6">
                    <Card
                        className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4 shadow-xl"
                    >
                        <div
                            className="flex items-center gap-2 text-lime-400 font-bold text-xs uppercase tracking-wider"
                        >
                            <Info className="w-4 h-4 text-lime-400 shrink-0" />
                            Petunjuk Konfigurasi
                        </div>
                        <ul className="text-xs text-zinc-400 space-y-3 list-disc pl-4 leading-relaxed">
                            {TOURNAMENT_SETTING_HINTS.map((hint) => (
                                <li key={hint.label}>
                                    <strong className="text-zinc-200 font-bold">
                                        {hint.label}:
                                    </strong>{' '}
                                    <span className="text-zinc-400">{hint.description}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card
                        className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3 shadow-md"
                    >
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Modul Terkait Selanjutnya
                        </h4>
                        <div className="space-y-2.5">
                            {RELATED_MODULES.map((module) => (
                                <div
                                    key={module.title}
                                    className="text-xs p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-lime-400/50 transition-colors"
                                >
                                    <div className="font-bold text-white">
                                        {module.title}
                                    </div>
                                    <div className="text-zinc-400 mt-0.5">
                                        {module.description}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
