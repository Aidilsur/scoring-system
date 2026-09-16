'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
    Calendar,
    RotateCw,
    Info,
    CheckCircle2,
    AlertCircle,
    X,
    Layers,
    Zap,
    Trash2,
    ShieldAlert,
    Trophy,
} from 'lucide-react'
import { useScheduleManagement } from '@/hooks/useScheduleManagement'
import { SelectInput, Card } from '@/components/ui'
import { SchedulePreviewCard } from './SchedulePreviewCard'
import { ScheduleGridView } from './ScheduleGridView'
import { ScheduleWarningCard } from './ScheduleWarningCard'
import { ScheduleRegenerateConfirmModal } from './ScheduleRegenerateConfirmModal'
import { KnockoutScheduleTab } from './KnockoutScheduleTab'

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
        label: 'Kunci Regenerate & Reset',
        description:
            'Regenerate dan reset otomatis dikunci apabila terdapat pertandingan yang berstatus live atau selesai.',
    },
] as const

export interface ScheduleManagementViewProps {
    initialCategoryId?: string
}

export function ScheduleManagementView({
    initialCategoryId,
}: ScheduleManagementViewProps) {
    const [mainTab, setMainTab] = useState<'group' | 'knockout'>('group')

    const {
        scheduleMode,
        setScheduleMode,
        categories,
        selectedCategoryId,
        setSelectedCategoryId,
        singleCategoryId,
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
        isResetting,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        confirmModalMode,
        toast,
        clearToast,
        unscheduledWarning,
        clearUnscheduledWarning,
        handleTriggerSchedule,
        handleTriggerAllSchedule,
        handleTriggerReset,
        handleConfirmRegenerate,
    } = useScheduleManagement(initialCategoryId)

    const categoryOptions = categories.map((cat) => ({
        value: cat.id,
        label: (cat as any).displayLabel || `${cat.name} (${cat.partner_type.toUpperCase()} - ${cat.level.toUpperCase()})`,
    }))

    const hasStartedMatchesGlobal = Boolean(scheduleData?.hasAnyStartedGroupMatches)
    const hasScheduledMatchesGlobal = Boolean(scheduleData?.hasAnyScheduledGroupMatches)

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
                        Atur pembagian waktu &amp; court pertandingan babak grup dan babak knockout dengan jaminan jeda istirahat 1 ronde.
                    </p>
                </div>

                {/* Top Action Controls: Refresh & Reset (Hanya di Tab Grup) */}
                <div className="flex items-center gap-2.5">
                    {mainTab === 'group' && (
                        <button
                            type="button"
                            onClick={handleTriggerReset}
                            disabled={
                                isGenerating ||
                                hasStartedMatchesGlobal ||
                                !hasScheduledMatchesGlobal
                            }
                            title={
                                hasStartedMatchesGlobal
                                    ? 'Reset dinonaktifkan: terdapat pertandingan babak grup yang sedang live atau selesai'
                                    : !hasScheduledMatchesGlobal
                                    ? 'Belum ada jadwal pertandingan babak grup yang tersimpan'
                                    : 'Kosongkan lapangan dan waktu pertandingan untuk SEMUA match babak grup di seluruh kategori'
                            }
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-zinc-900 border border-rose-500/40 text-rose-300 hover:bg-rose-950/40 hover:border-rose-500 hover:text-rose-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-black/40"
                        >
                            <Trash2 className={`w-3.5 h-3.5 text-rose-400 ${isResetting ? 'animate-spin' : ''}`} />
                            <span>Reset Semua Jadwal</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => refetchSchedule()}
                        disabled={isLoadingSchedule || isRefetchingSchedule}
                        aria-label="Segarkan Data"
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer disabled:opacity-50 shadow-md shadow-black/30"
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

            {/* 2 TAB BESAR: FASE GRUP vs BABAK KNOCKOUT */}
            <div className="flex border-b border-zinc-800 gap-2 sm:gap-6">
                <button
                    type="button"
                    onClick={() => setMainTab('group')}
                    className={`pb-3.5 px-1 sm:px-2 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
                        mainTab === 'group'
                            ? 'border-lime-400 text-lime-400'
                            : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    <Calendar className="w-4 h-4" />
                    <span>Fase Grup</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMainTab('knockout')}
                    className={`pb-3.5 px-1 sm:px-2 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer ${
                        mainTab === 'knockout'
                            ? 'border-lime-400 text-lime-400'
                            : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                    <Trophy className="w-4 h-4" />
                    <span>Babak Knockout</span>
                </button>
            </div>

            {/* TAB 1: KONTEN FASE GRUP */}
            {mainTab === 'group' ? (
                <>
                    {/* Mode Switcher Toggle (Bertahap vs Paralel) */}
                    <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 mr-2">
                                Pilih Mode Penjadwalan:
                            </span>
                            <div className="inline-flex p-1 rounded-xl bg-zinc-950 border border-zinc-800 self-start">
                                <button
                                    type="button"
                                    onClick={() => setScheduleMode('step_by_step')}
                                    disabled={isGenerating}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                                        scheduleMode === 'step_by_step'
                                            ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                    }`}
                                >
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Generate Bertahap</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900/60 text-zinc-300 font-mono">
                                        Default
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setScheduleMode('parallel')}
                                    disabled={isGenerating}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                                        scheduleMode === 'parallel'
                                            ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                                    }`}
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    <span>Generate Paralel</span>
                                </button>
                            </div>
                        </div>

                        <div className="text-xs text-zinc-400 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-lime-400 shrink-0" />
                            <span>
                                {scheduleMode === 'step_by_step' ? (
                                    <>
                                        Target Penjadwalan: <strong className="text-lime-300">{(selectedCategory as any)?.displayLabel || selectedCategory?.name || 'Pilih Kategori'}</strong>
                                    </>
                                ) : (
                                    <>
                                        Mode Paralel: <strong className="text-lime-300">Semua Kategori ({categories.length})</strong>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

            {/* Category Selector (HANYA MUNCUL DI MODE BERTAHAP) */}
            {scheduleMode === 'step_by_step' && (
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
                    <div className="flex-1 max-w-md">
                        <SelectInput
                            id="schedule-category-select"
                            label="Pilih Kategori Yang Ingin Dijadwalkan"
                            value={singleCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            disabled={isLoadingCategories || isGenerating}
                            options={categoryOptions}
                        />
                    </div>

                    <div className="text-xs text-zinc-400 pt-1 sm:pt-4 max-w-sm leading-relaxed">
                        💡 Penjadwalan bertahap pada kategori ini bersifat <strong>non-destructive</strong> terhadap kategori lain karena otomatis mendeteksi slot waktu dan court yang sudah terisi.
                    </div>
                </div>
            )}

            {/* Banner Mode Paralel (HANYA MUNCUL DI MODE PARALEL) */}
            {scheduleMode === 'parallel' && (
                <div className="p-4 rounded-2xl bg-lime-950/20 border border-lime-500/30 flex items-start gap-3 text-xs text-lime-200 animate-in fade-in duration-200">
                    <Zap className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                        <strong className="text-lime-300 font-bold block text-sm">
                            Mode Generate Paralel Aktif
                        </strong>
                        <p className="text-zinc-300">
                            Seluruh pertandingan babak grup dari seluruh kategori akan dijadwalkan secara terpadu. Court akan terisi serentak antar kategori dengan jaminan jeda istirahat minimal 1 ronde per tim.
                        </p>
                    </div>
                </div>
            )}

            {/* Warning jika ada match live/completed sehingga reset dinonaktifkan */}
            {hasStartedMatchesGlobal && (
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5 shadow-md">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                        <strong>Proteksi Turnamen Aktif:</strong> Ada pertandingan babak grup yang sedang live atau telah selesai. Fitur Regenerate dan Reset dikunci demi menjaga integritas data.
                    </span>
                </div>
            )}

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
                        onGenerate={
                            isAllMode ? handleTriggerAllSchedule : handleTriggerSchedule
                        }
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
                </>
            ) : (
                <KnockoutScheduleTab initialCategoryId={singleCategoryId} />
            )}

            {/* Confirm Regenerate / Reset Dialog Modal */}
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
