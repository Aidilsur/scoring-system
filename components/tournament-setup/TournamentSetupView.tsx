'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, X, Info, ArrowLeft } from 'lucide-react'
import { useTournamentSettingsForm } from '@/hooks/useTournamentSettingsForm'
import { TournamentSetupForm } from './TournamentSetupForm'
import { ShareRegistrationCard } from './ShareRegistrationCard'
import { Card, Button } from '@/components/ui'
import { TournamentSettings } from '@/types/domain'

export interface TournamentSetupViewProps {
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800">
                <div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
                        <Link href="/admin" className="hover:text-lime-400 transition-colors">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-lime-400 font-bold uppercase tracking-wider">
                            Setup Turnamen
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                        Konfigurasi Turnamen
                    </h1>
                    <p className="text-xs sm:text-sm text-emerald-300/90 mt-1">
                        Kelola parameter turnamen, format pertandingan grup, jumlah lapangan, dan aturan scoring.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/admin">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-800 text-emerald-300 hover:text-white rounded-xl"
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
                    className={`p-4 rounded-xl text-sm flex items-start justify-between gap-3 transition shadow-lg ${
                        feedback.type === 'success'
                            ? 'bg-emerald-950 border border-lime-400/50 text-lime-300 shadow-emerald-950/60'
                            : 'bg-red-950/80 border border-red-500/50 text-red-200 shadow-red-950/60'
                    }`}
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
                <div className="p-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-sm flex items-center justify-between shadow-lg">
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
                        <Card className="p-12 text-center bg-emerald-900/70 border-emerald-800 rounded-xl">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-lime-400 border-t-transparent mb-3" />
                            <p className="text-sm text-emerald-300 font-medium">Memuat konfigurasi turnamen...</p>
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
                    <Card className="p-6 bg-emerald-900/70 border-emerald-800 rounded-xl space-y-4 shadow-xl shadow-emerald-950/40">
                        <div className="flex items-center gap-2 text-lime-400 font-black text-xs uppercase tracking-wider">
                            <Info className="w-4 h-4 text-lime-400 shrink-0" />
                            Petunjuk Konfigurasi
                        </div>
                        <ul className="text-xs text-emerald-300 space-y-3 list-disc pl-4 leading-relaxed">
                            {TOURNAMENT_SETTING_HINTS.map((hint) => (
                                <li key={hint.label}>
                                    <strong className="text-white font-bold">
                                        {hint.label}:
                                    </strong>{' '}
                                    <span className="text-emerald-300/90">{hint.description}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card className="p-6 bg-emerald-900/50 border-emerald-800 rounded-xl space-y-3 shadow-md shadow-emerald-950/30">
                        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                            Modul Terkait Selanjutnya
                        </h4>
                        <div className="space-y-2.5">
                            {RELATED_MODULES.map((module) => (
                                <div
                                    key={module.title}
                                    className="text-xs p-3.5 rounded-xl border border-emerald-800/80 bg-emerald-950/70 hover:border-lime-400/60 transition-colors"
                                >
                                    <div className="font-bold text-white">
                                        {module.title}
                                    </div>
                                    <div className="text-emerald-300/80 mt-0.5">
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
