'use client'

import React from 'react'
import Link from 'next/link'
import { useTournamentSettingsForm } from '@/hooks/useTournamentSettingsForm'
import { TournamentSetupForm } from './TournamentSetupForm'
import { Card, Button } from '@/components/ui'
import { TournamentSettings } from '@/types/domain'

export interface TournamentSetupViewProps {
    initialData?: TournamentSettings | null
}

const TOURNAMENT_SETTING_HINTS = [
    {
        label: 'Nama Turnamen',
        description: 'Judul kegiatan yang tertera pada public scoreboard display.',
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <Link href="/admin" className="hover:underline">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                            Setup Turnamen
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Konfigurasi Turnamen
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Kelola parameter turnamen, format pertandingan grup, jumlah lapangan, dan aturan skor.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/admin">
                        <Button variant="secondary" size="sm">
                            ← Kembali ke Dashboard
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Alert / Feedback Notification */}
            {feedback && (
                <div
                    className={`p-4 rounded-xl text-sm flex items-start justify-between gap-3 transition ${
                        feedback.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800/60'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {feedback.type === 'success' ? (
                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <span>{feedback.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={clearFeedback}
                        className="text-xs opacity-70 hover:opacity-100 transition p-1"
                        aria-label="Tutup pemberitahuan"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Query Error State */}
            {isQueryError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
                    <div>Gagal memuat pengaturan: {queryError?.message}</div>
                    <Button variant="secondary" size="sm" onClick={() => refetch()}>
                        Coba Lagi
                    </Button>
                </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Column */}
                <div className="lg:col-span-2">
                    {isQueryLoading && !settings ? (
                        <Card className="p-12 text-center bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3" />
                            <p className="text-sm text-zinc-500">Memuat konfigurasi turnamen...</p>
                        </Card>
                    ) : (
                        <TournamentSetupForm
                            values={values}
                            fieldErrors={fieldErrors}
                            isSubmitting={isSubmitting}
                            isEditMode={isEditMode}
                            currentStatus={settings?.status}
                            onFieldChange={setFieldValue}
                            onSubmit={handleSubmit}
                        />
                    )}
                </div>

                {/* Information / Guidelines Sidebar */}
                <div className="space-y-6">
                    <Card className="p-5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold text-sm">
                            <span className="text-emerald-500">ℹ</span>
                            Petunjuk Konfigurasi
                        </div>
                        <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2.5 list-disc pl-4 leading-relaxed">
                            {TOURNAMENT_SETTING_HINTS.map((hint) => (
                                <li key={hint.label}>
                                    <strong className="text-zinc-800 dark:text-zinc-200">
                                        {hint.label}:
                                    </strong>{' '}
                                    {hint.description}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                            Modul Terkait Selanjutnya
                        </h4>
                        <div className="space-y-2">
                            {RELATED_MODULES.map((module) => (
                                <div
                                    key={module.title}
                                    className="text-xs text-zinc-500 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40"
                                >
                                    <strong className="text-zinc-800 dark:text-zinc-200">{module.title}</strong>
                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                        {module.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
