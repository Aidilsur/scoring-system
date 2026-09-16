'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, RotateCw, Trash2, Trophy } from 'lucide-react'
import { useScheduleManagement } from '@/hooks/useScheduleManagement'
import { cn } from '@/lib/utils'
import { GroupScheduleTab } from './GroupScheduleTab'
import { KnockoutScheduleTab } from './KnockoutScheduleTab'
import { ScheduleRegenerateConfirmModal } from './ScheduleRegenerateConfirmModal'

interface ScheduleManagementViewProps {
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
        clearUnscheduledWarning,
        handleTriggerSchedule,
        handleTriggerAllSchedule,
        handleTriggerReset,
        handleConfirmRegenerate,
    } = useScheduleManagement(initialCategoryId)

    const categoryOptions = categories.map((cat) => ({
        value: cat.id,
        label:
            (cat as any).displayLabel ||
            `${cat.name} (${cat.partner_type.toUpperCase()} - ${cat.level.toUpperCase()})`,
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
                        Atur pembagian waktu &amp; court pertandingan babak grup dan babak knockout
                        dengan jaminan jeda istirahat 1 ronde.
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
                            <Trash2
                                className={cn(
                                    'w-3.5 h-3.5 text-rose-400',
                                    isResetting && 'animate-spin'
                                )}
                            />
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
                            className={cn(
                                'w-3.5 h-3.5',
                                isRefetchingSchedule && 'animate-spin text-lime-400'
                            )}
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
                    className={cn(
                        'pb-3.5 px-1 sm:px-2 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer',
                        {
                            'border-lime-400 text-lime-400':
                                mainTab === 'group',
                            'border-transparent text-zinc-400 hover:text-zinc-200':
                                mainTab !== 'group',
                        }
                    )}
                >
                    <Calendar className="w-4 h-4" />
                    <span>Fase Grup</span>
                </button>

                <button
                    type="button"
                    onClick={() => setMainTab('knockout')}
                    className={cn(
                        'pb-3.5 px-1 sm:px-2 text-sm sm:text-base font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition cursor-pointer',
                        {
                            'border-lime-400 text-lime-400':
                                mainTab === 'knockout',
                            'border-transparent text-zinc-400 hover:text-zinc-200':
                                mainTab !== 'knockout',
                        }
                    )}
                >
                    <Trophy className="w-4 h-4" />
                    <span>Babak Knockout</span>
                </button>
            </div>

            {/* TAB CONTENT */}
            {mainTab === 'group' ? (
                <GroupScheduleTab
                    scheduleMode={scheduleMode}
                    setScheduleMode={setScheduleMode}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    singleCategoryId={singleCategoryId}
                    setSelectedCategoryId={setSelectedCategoryId}
                    categoryOptions={categoryOptions}
                    isAllMode={isAllMode}
                    scheduleData={scheduleData}
                    hasStartedMatchesGlobal={hasStartedMatchesGlobal}
                    toast={toast}
                    clearToast={clearToast}
                    clearUnscheduledWarning={clearUnscheduledWarning}
                    isCategoriesError={isCategoriesError}
                    categoriesError={categoriesError}
                    isLoadingCategories={isLoadingCategories}
                    isLoadingSchedule={isLoadingSchedule}
                    isGenerating={isGenerating}
                    handleTriggerAllSchedule={handleTriggerAllSchedule}
                    handleTriggerSchedule={handleTriggerSchedule}
                    selectedCategoryId={selectedCategoryId}
                />
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
