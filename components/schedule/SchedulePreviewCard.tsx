'use client'

import React from 'react'
import {
    Clock,
    Layers,
    AlertCircle,
    CheckCircle2,
    RotateCw,
    Sparkles,
    ShieldAlert,
} from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { CategoryScheduleData } from '@/hooks/useScheduleQuery'
import { Category } from '@/types/domain'

interface SchedulePreviewCardProps {
    category?: Category
    scheduleData?: CategoryScheduleData
    isAllMode?: boolean
    isLoading: boolean
    isGenerating: boolean
    onGenerate: () => void
}

export function SchedulePreviewCard({
    category,
    scheduleData,
    isAllMode = false,
    isLoading,
    isGenerating,
    onGenerate,
}: SchedulePreviewCardProps) {
    if (isLoading) {
        return (
            <Card className="p-8 text-center bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-lime-400 border-t-transparent mb-3" />
                <p className="text-sm text-zinc-400 font-medium">
                    Memuat data jadwal {isAllMode ? 'seluruh kategori' : 'kategori'}...
                </p>
            </Card>
        )
    }

    if (!category && !isAllMode) {
        return (
            <Card className="p-8 text-center bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                <p className="text-sm text-zinc-400">
                    Pilih kategori terlebih dahulu untuk melihat ringkasan jadwal pertandingan.
                </p>
            </Card>
        )
    }

    const {
        totalMatches = 0,
        scheduledMatches = [],
        unscheduledMatches = [],
        courts = [],
        tournamentSettings,
        hasExistingSchedule = false,
        hasStartedMatches = false,
        allScheduled = false,
    } = scheduleData || {}

    const startTime = tournamentSettings?.daily_start_time?.slice(0, 5) || '08:00'
    const endTime = tournamentSettings?.daily_end_time?.slice(0, 5) || '18:00'
    const duration = tournamentSettings?.match_duration_minutes || 45

    return (
        <Card
            className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-6 text-white shadow-xl"
        >
            {/* Header info */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800"
            >
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span
                            className="text-xs font-mono font-bold uppercase tracking-wider text-lime-400"
                        >
                            {isAllMode
                                ? 'Ringkasan Penjadwalan Paralel (Global)'
                                : 'Ringkasan Penjadwalan Kategori'}
                        </span>
                        {hasStartedMatches && (
                            <Badge variant="danger" className="text-[10px] font-mono uppercase">
                                Pertandingan Telah Dimulai
                            </Badge>
                        )}
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-white uppercase">
                        {isAllMode
                            ? 'Seluruh Kategori (Paralel)'
                            : `${category?.name || ''}${
                                  (category as any)?.roundLabel
                                      ? ` — ${(category as any).roundLabel}`
                                      : ''
                              }`}
                    </h3>
                    <p className="text-xs text-zinc-400">
                        {isAllMode
                            ? 'Menjadwalkan seluruh match dari semua kategori sekaligus agar court terisi paralel'
                            : `Format: ${category?.partner_type?.toUpperCase()} • Level: ${category?.level?.toUpperCase()}`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {allScheduled ? (
                        <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-lime-400/15 border border-lime-400/30 text-lime-400"
                        >
                            <CheckCircle2 className="w-4 h-4 text-lime-400" />
                            Semua Terjadwal
                        </span>
                    ) : hasExistingSchedule ? (
                        <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/15 border border-amber-400/30 text-amber-400"
                        >
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            Jadwal Parsial
                        </span>
                    ) : (
                        <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-400"
                        >
                            Belum Dijadwalkan
                        </span>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Metric 1: Total Match */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                    <div
                        className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <Layers className="w-3.5 h-3.5 text-lime-400" />
                        Total Match
                    </div>
                    <div className="text-2xl font-black text-white">{totalMatches}</div>
                    <div className="text-[10px] text-zinc-500">
                        {isAllMode ? 'Seluruh kategori aktif' : 'Babak grup round-robin'}
                    </div>
                </div>

                {/* Metric 2: Terjadwal */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                    <div
                        className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                        Terjadwal
                    </div>
                    <div className="text-2xl font-black text-lime-400">
                        {scheduledMatches.length}
                    </div>
                    <div className="text-[10px] text-zinc-500">Memiliki slot court &amp; jam</div>
                </div>

                {/* Metric 3: Belum Terjadwal */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                    <div
                        className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        Sisa Match
                    </div>
                    <div
                        className={cn('text-2xl font-black', {
                            'text-amber-400': unscheduledMatches.length > 0,
                            'text-zinc-500': unscheduledMatches.length === 0,
                        })}
                    >
                        {unscheduledMatches.length}
                    </div>
                    <div className="text-[10px] text-zinc-500">Menunggu penjadwalan</div>
                </div>

                {/* Metric 4: Court & Waktu */}
                <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1">
                    <div
                        className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <Clock className="w-3.5 h-3.5 text-lime-400" />
                        Jam &amp; Durasi
                    </div>
                    <div className="text-sm font-black text-white truncate">
                        {startTime} - {endTime}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                        {courts.length} Court • {duration}m/match
                    </div>
                </div>
            </div>

            {/* Knockout Reservation Notice (Requirement 3) */}
            {scheduleData?.knockoutReservation &&
                scheduleData.knockoutReservation.reservedRounds > 0 &&
                (isAllMode || scheduleData.targetRound === 'group') && (
                    <div
                        className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs animate-in fade-in duration-200"
                    >
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="font-bold text-amber-200">
                                ℹ️ Informasi Alokasi Waktu Knockout:
                            </p>
                            <p className="leading-relaxed">
                                <strong>
                                    {scheduleData.knockoutReservation.reservedRounds} ronde
                                </strong>{' '}
                                di akhir jadwal akan dicadangkan untuk babak semifinal/final dari{' '}
                                <strong>
                                    {scheduleData.knockoutReservation.activeCategoriesCount} kategori aktif
                                </strong>
                                {scheduleData.knockoutReservation.reservedStartTime ? (
                                    <span>
                                        {' '}(mulai pukul <strong>{scheduleData.knockoutReservation.reservedStartTime}</strong>)
                                    </span>
                                ) : null}
                                . Slot yang tersedia untuk pertandingan fase grup akan dibatasi hingga
                                sebelum blok waktu cadangan ini agar babak gugur terjamin mendapat slot.
                            </p>
                        </div>
                    </div>
                )}

            {/* Action Buttons & Notice */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-zinc-400">
                    {hasStartedMatches ? (
                        <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            Regenerate dikunci karena ada match yang sedang live atau selesai.
                        </span>
                    ) : isAllMode ? (
                        <span>
                            ⚡ <strong>Mode Paralel:</strong> Mengisi seluruh court secara optimal
                            antar kategori pada ronde yang sama dengan jaminan jeda 1 ronde per tim.
                        </span>
                    ) : (
                        <span>
                            Penjadwalan otomatis mempertimbangkan jeda 1 ronde antar tim dan
                            menghindari slot yang sudah terpakai kategori lain.
                        </span>
                    )}
                </div>

                <Button
                    variant="primary"
                    onClick={onGenerate}
                    isLoading={isGenerating}
                    disabled={isGenerating || hasStartedMatches || totalMatches === 0}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl !bg-lime-400 hover:!bg-lime-300 !text-zinc-950 !font-black uppercase tracking-wider shadow-lg shadow-lime-400/20 active:scale-[0.99] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                    {isAllMode ? (
                        hasExistingSchedule ? (
                            <>
                                <RotateCw className="w-4 h-4" />
                                <span>Regenerate SEMUA Kategori (Paralel)</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span>Generate SEMUA Kategori (Paralel)</span>
                            </>
                        )
                    ) : hasExistingSchedule ? (
                        <>
                            <RotateCw className="w-4 h-4" />
                            <span>Regenerate Jadwal Kategori Ini</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generate Jadwal Kategori Ini</span>
                        </>
                    )}
                </Button>
            </div>
        </Card>
    )
}
