'use client'

import React from 'react'
import Link from 'next/link'
import {
    Calendar,
    RotateCw,
    Info,
    CheckCircle2,
    AlertCircle,
    X,
    Clock,
    Layers,
    MapPin,
} from 'lucide-react'
import { useScheduleManagement } from '@/hooks/useScheduleManagement'
import { SelectInput, Card } from '@/components/ui'
import { SchedulePreviewCard } from './SchedulePreviewCard'
import { ScheduleGridView } from './ScheduleGridView'
import { ScheduleWarningCard } from './ScheduleWarningCard'
import { ScheduleRegenerateConfirmModal } from './ScheduleRegenerateConfirmModal'

const SCHEDULE_RULE_HINTS = [
    {
        label: 'Resource Bersama Lintas Kategori',
        description:
            'Lapangan (courts) adalah resource bersama seluruh kategori turnamen. Penjadwalan otomatis menghindari slot yang sudah dipakai kategori lain.',
    },
    {
        label: 'Wajib Jeda Minimal 1 Ronde',
        description:
            'Setiap tim dijamin memiliki minimal 1 ronde jeda penuh antar pertandingan agar stamina terjaga, bahkan jika court harus kosong di ronde tertentu.',
    },
    {
        label: 'Jam Operasional Turnamen',
        description:
            'Pertandingan hanya dijadwalkan dalam rentang dailyStartTime sampai dailyEndTime yang telah ditentukan di Setup Turnamen.',
    },
    {
        label: 'Proteksi Unscheduled',
        description:
            'Jika waktu operasional habis sebelum seluruh match terjadwal, sisa pertandingan akan diberi peringatan tanpa melanggar aturan jeda.',
    },
    {
        label: 'Kunci Regenerate',
        description:
            'Fitur regenerate otomatis dikunci apabila ada pertandingan di kategori ini yang berstatus live atau selesai.',
    },
] as const

export interface ScheduleManagementViewProps {
    initialCategoryId?: string
}

export function ScheduleManagementView({
    initialCategoryId,
}: ScheduleManagementViewProps) {
    const {
        categories,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedCategory,
        isAllMode,
        scheduleData,
        isLoadingCategories,
        isLoadingSchedule,
        isRefetchingSchedule,
        refetchSchedule,
        isCategoriesError,
        categoriesError,
        isGenerating,
        isGeneratingAll,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        confirmModalMode,
        toast,
        clearToast,
        unscheduledWarning,
        clearUnscheduledWarning,
        handleTriggerSchedule,
        handleTriggerAllSchedule,
        handleConfirmRegenerate,
    } = useScheduleManagement(initialCategoryId)

    const categoryOptions = [
        { value: 'ALL', label: '🌟 Semua Kategori (Jadwal Gabungan Paralel)' },
        ...categories.map((cat) => ({
            value: cat.id,
            label: `${cat.name} (${cat.partner_type.toUpperCase()} - ${cat.level.toUpperCase()})`,
        })),
    ]

    return (
        <div className="space-y-8">
            {/* Top Header & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                        <Link href="/admin" className="hover:text-lime-400 transition-colors">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-200 font-medium">
                            Jadwal Pertandingan
                        </span>
                    </div>
                    <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight">
                        Penjadwalan Pertandingan
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        Atur pembagian waktu &amp; court round-robin secara paralel atau per kategori dengan proteksi jeda istirahat 1 ronde.
                    </p>
                </div>

                {/* Top Action Buttons: Generate Semua & Refresh */}
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleTriggerAllSchedule}
                        disabled={isGenerating || scheduleData?.hasStartedMatches}
                        title={
                            scheduleData?.hasStartedMatches
                                ? 'Regenerate dikunci karena ada match live/selesai'
                                : 'Jadwalkan seluruh match babak grup dari semua kategori secara serentak (paralel)'
                        }
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 transition cursor-pointer disabled:opacity-50 shadow-md shadow-lime-400/20"
                    >
                        <RotateCw
                            className={`w-3.5 h-3.5 ${isGeneratingAll ? 'animate-spin' : ''}`}
                        />
                        <span>Generate SEMUA Kategori (Paralel)</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => refetchSchedule()}
                        disabled={isLoadingSchedule || isRefetchingSchedule}
                        aria-label="Segarkan Data"
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer disabled:opacity-50"
                    >
                        <RotateCw
                            className={`w-3.5 h-3.5 ${
                                isRefetchingSchedule ? 'animate-spin text-lime-400' : ''
                            }`}
                        />
                        <span className="hidden sm:inline">Segarkan</span>
                    </button>
                </div>
            </div>

            {/* Category Filter Selector & Quick Switcher */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                    <SelectInput
                        id="schedule-category-select"
                        label="Pilih Tampilan Kategori Jadwal"
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        disabled={isLoadingCategories || isGenerating}
                        options={categoryOptions}
                    />
                </div>

                <div className="text-xs text-zinc-400 flex items-center gap-2 pt-1 sm:pt-4">
                    <Layers className="w-4 h-4 text-lime-400 shrink-0" />
                    <span>
                        Mode aktif:{' '}
                        <strong className="text-lime-300">
                            {isAllMode ? 'Semua Kategori (Paralel)' : (selectedCategory?.name || '')}
                        </strong>
                    </span>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div
                    className={`p-4 rounded-xl text-sm flex items-start justify-between gap-3 transition shadow-lg ${
                        toast.type === 'success'
                            ? 'bg-zinc-900 border border-lime-400/50 text-lime-300 shadow-black/40'
                            : toast.type === 'warning'
                            ? 'bg-amber-950/80 border border-amber-500/50 text-amber-200 shadow-black/40'
                            : 'bg-zinc-900 border border-red-500/50 text-red-200 shadow-black/40'
                    }`}
                >
                    <div className="flex items-center gap-2.5">
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                        )}
                        <span className="font-semibold">{toast.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={clearToast}
                        className="text-xs opacity-70 hover:opacity-100 transition p-1 cursor-pointer"
                        aria-label="Tutup notifikasi"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Unscheduled Matches Warning */}
            {scheduleData && scheduleData.unscheduledMatches.length > 0 && (
                <ScheduleWarningCard
                    unscheduledMatches={scheduleData.unscheduledMatches}
                    onDismiss={clearUnscheduledWarning}
                />
            )}

            {/* Error Message if categories fail to load */}
            {isCategoriesError && (
                <div className="p-4 rounded-xl bg-zinc-900 border border-red-500/50 text-red-300 text-sm">
                    Gagal memuat kategori: {categoriesError?.message}
                </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Summary Card & Schedule Timetable Grid */}
                <div className="lg:col-span-2 space-y-6">
                    <SchedulePreviewCard
                        category={selectedCategory}
                        scheduleData={scheduleData}
                        isAllMode={isAllMode}
                        isLoading={isLoadingSchedule}
                        isGenerating={isGenerating}
                        onGenerate={handleTriggerSchedule}
                    />

                    {selectedCategoryId && (
                        <ScheduleGridView
                            courts={scheduleData?.courts || []}
                            scheduledMatches={scheduleData?.scheduledMatches || []}
                            occupiedSlots={scheduleData?.occupiedSlots || []}
                            startTime={scheduleData?.tournamentSettings?.daily_start_time?.slice(0, 5)}
                            endTime={scheduleData?.tournamentSettings?.daily_end_time?.slice(0, 5)}
                            durationMinutes={scheduleData?.tournamentSettings?.match_duration_minutes}
                        />
                    )}
                </div>

                {/* Right Column: Rules & Info Sidebar */}
                <div className="space-y-6">
                    <Card className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4 shadow-xl">
                        <div className="flex items-center gap-2 text-lime-400 font-bold text-xs uppercase tracking-wider">
                            <Info className="w-4 h-4 text-lime-400 shrink-0" />
                            Aturan Penjadwalan Padel
                        </div>
                        <ul className="text-xs text-zinc-400 space-y-3.5 list-disc pl-4 leading-relaxed">
                            {SCHEDULE_RULE_HINTS.map((hint) => (
                                <li key={hint.label}>
                                    <strong className="text-zinc-200 font-bold">
                                        {hint.label}:
                                    </strong>{' '}
                                    <span className="text-zinc-400">{hint.description}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3 shadow-md">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            Navigasi Modul Terkait
                        </h4>
                        <div className="space-y-2.5">
                            <Link
                                href="/admin/draw"
                                className="block text-xs p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-lime-400/50 transition-colors"
                            >
                                <div className="font-bold text-white">
                                    Drawing Grup (/admin/draw)
                                </div>
                                <div className="text-zinc-400 mt-0.5">
                                    Lakukan undian peserta ke dalam grup sebelum membuat jadwal.
                                </div>
                            </Link>

                            <Link
                                href="/admin/tournament-setup"
                                className="block text-xs p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-lime-400/50 transition-colors"
                            >
                                <div className="font-bold text-white">
                                    Setup Turnamen (/admin/tournament-setup)
                                </div>
                                <div className="text-zinc-400 mt-0.5">
                                    Ubah jam operasional harian, jumlah court, atau durasi match.
                                </div>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Confirm Regenerate Dialog Modal */}
            <ScheduleRegenerateConfirmModal
                isOpen={isConfirmModalOpen}
                mode={confirmModalMode}
                categoryName={selectedCategory?.name}
                isGenerating={isGenerating}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmRegenerate}
            />
        </div>
    )
}
