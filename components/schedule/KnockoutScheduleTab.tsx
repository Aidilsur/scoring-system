'use client'

import React from 'react'
import Link from 'next/link'
import {
    Trophy,
    Calendar,
    RotateCw,
    Clock,
    AlertCircle,
    CheckCircle2,
    Lock,
    ExternalLink,
    Sparkles,
} from 'lucide-react'
import { SelectInput, Button, Badge, Card } from '@/components/ui'
import { useKnockoutSchedule, KnockoutRoundItem } from '@/hooks/useKnockoutSchedule'
import { ScheduleGridView } from './ScheduleGridView'
import { extractHHmm } from '@/hooks/useScheduleQuery'
import type { Match } from '@/types/domain'

export interface KnockoutScheduleTabProps {
    initialCategoryId?: string
}

export function KnockoutScheduleTab({ initialCategoryId }: KnockoutScheduleTabProps) {
    const {
        categories,
        isLoadingCategories,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedCategory,
        knockoutData,
        isLoadingKnockout,
        isRefetchingKnockout,
        refetchKnockout,
        generatingRound,
        isGeneratingKnockout,
        handleGenerateRound,
    } = useKnockoutSchedule(initialCategoryId)

    const categoryOptions = categories.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.partner_type.toUpperCase()} - ${c.level.toUpperCase()})`,
    }))

    const visibleRounds = knockoutData?.visibleRounds || []
    const allCompleted = Boolean(knockoutData?.allKnockoutCompleted)

    return (
        <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Kontrol Kategori & Segarkan */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div className="flex-1 max-w-md">
                    <SelectInput
                        id="knockout-category-select"
                        label="Pilih Kategori Babak Knockout"
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        disabled={isLoadingCategories || isGeneratingKnockout}
                        options={categoryOptions}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => refetchKnockout()}
                        disabled={isLoadingKnockout || isRefetchingKnockout}
                        className="text-xs"
                    >
                        <RotateCw
                            className={`w-3.5 h-3.5 mr-1.5 ${
                                isRefetchingKnockout ? 'animate-spin text-lime-400' : ''
                            }`}
                        />
                        <span>Segarkan Data</span>
                    </Button>
                </div>
            </div>

            {/* Banner Penjelasan Alur Knockout */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-lime-500/30 text-xs text-lime-200 flex items-start gap-3">
                <Trophy className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <strong className="text-lime-300 font-bold block text-sm">
                        Alur Penjadwalan Babak Knockout ({selectedCategory?.name || 'Kategori'})
                    </strong>
                    <p className="text-zinc-300 leading-relaxed">
                        Penjadwalan babak knockout berjalan berurutan setelah babak grup selesai. Sistem otomatis menempatkan pertandingan di slot court yang tersedia setelah seluruh jadwal grup dan babak sebelumnya selesai, serta melindungi jeda istirahat antar match.
                    </p>
                </div>
            </div>

            {/* Banner Khusus: Jika Seluruh Babak Knockout Sudah Completed */}
            {allCompleted && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border-2 border-lime-400/80 shadow-2xl shadow-lime-400/10 text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lime-400 text-zinc-950 mx-auto">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wider">
                        Seluruh Babak Knockout Telah Selesai Dimainkan! 🏆
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-lg mx-auto">
                        Semua pertandingan semifinal dan final untuk kategori {selectedCategory?.name} telah selesai. Jadwal yang telah selesai disembunyikan dari daftar generate.
                    </p>
                    <div className="pt-2">
                        <Link href="/admin/bracket">
                            <Button variant="primary" size="sm">
                                <Trophy className="w-4 h-4 mr-1.5" />
                                Lihat Bracket &amp; Juara Turnamen
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Daftar Babak Knockout Berurutan (Semifinal -> Juara 3 -> Final) */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                        Status &amp; Penjadwalan Babak Knockout
                    </h2>
                    <span className="text-xs text-zinc-500">
                        {visibleRounds.length} Babak Aktif
                    </span>
                </div>

                {isLoadingKnockout ? (
                    <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                        <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-zinc-400">Memuat status babak knockout...</p>
                    </div>
                ) : visibleRounds.length === 0 && !allCompleted ? (
                    <div className="p-8 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                        <Clock className="w-8 h-8 text-zinc-500 mx-auto" />
                        <h4 className="text-sm font-bold text-white">Belum Ada Pertandingan Knockout</h4>
                        <p className="text-xs text-zinc-400 max-w-md mx-auto">
                            Pertandingan babak knockout untuk kategori ini belum dibuat. Selesaikan fase grup terlebih dahulu lalu generate bracket di menu Bracket.
                        </p>
                        <Link href="/admin/bracket">
                            <Button variant="outline" size="sm">
                                Buka Menu Bracket
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {visibleRounds.map((roundItem, idx) => {
                            const isGeneratingThis = generatingRound === roundItem.round

                            return (
                                <Card
                                    key={roundItem.round}
                                    className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                                        roundItem.isScheduled
                                            ? 'bg-zinc-900/90 border-lime-500/40 shadow-lg shadow-lime-500/5'
                                            : roundItem.exists
                                            ? 'bg-zinc-900/80 border-amber-500/40 shadow-lg shadow-amber-500/5'
                                            : 'bg-zinc-900/40 border-zinc-800/80 opacity-90'
                                    }`}
                                >
                                    {/* Header Babak */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-lime-400 font-mono font-bold text-xs flex items-center justify-center">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-white">
                                                    {roundItem.title}
                                                </h3>
                                                <p className="text-xs text-zinc-400">
                                                    {roundItem.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!roundItem.exists ? (
                                                <Badge variant="neutral" size="sm">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Match Belum Dibuat
                                                </Badge>
                                            ) : roundItem.isScheduled ? (
                                                <Badge variant="success" size="sm">
                                                    <CheckCircle2 className="w-3 h-3 mr-1 text-lime-400" />
                                                    Sudah Terjadwal
                                                </Badge>
                                            ) : (
                                                <Badge variant="warning" size="sm">
                                                    <Clock className="w-3 h-3 mr-1 text-amber-400" />
                                                    Belum Terjadwal
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Konten Pertandingan dalam Babak */}
                                    <div className="py-4">
                                        {!roundItem.exists ? (
                                            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                <div className="text-zinc-400">
                                                    Match untuk {roundItem.title.toLowerCase()} belum di-generate di database. Pastikan fase sebelumnya selesai, lalu buat pairing di menu Bracket.
                                                </div>
                                                <Link href="/admin/bracket">
                                                    <Button variant="outline" size="sm" className="shrink-0 text-xs">
                                                        <span>Generate di Bracket</span>
                                                        <ExternalLink className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {roundItem.matches.map((match: Match, mIdx: number) => {
                                                    const teamAName = `${match.team_a?.player1_name || 'Tim A'} / ${match.team_a?.player2_name || ''}`.trim()
                                                    const teamBName = `${match.team_b?.player1_name || 'Tim B'} / ${match.team_b?.player2_name || ''}`.trim()
                                                    const isMatchScheduled = Boolean(match.court && match.scheduled_time)

                                                    return (
                                                        <div
                                                            key={match.id}
                                                            className={`p-3.5 rounded-xl border transition-all ${
                                                                isMatchScheduled
                                                                    ? 'bg-zinc-950/80 border-zinc-800'
                                                                    : 'bg-zinc-950/40 border-dashed border-zinc-800'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-1.5">
                                                                <span>Match #{mIdx + 1}</span>
                                                                {match.status === 'live' ? (
                                                                    <span className="text-lime-400 font-bold uppercase">● LIVE</span>
                                                                ) : match.status === 'completed' ? (
                                                                    <span className="text-zinc-400 uppercase">SELESAI</span>
                                                                ) : (
                                                                    <span className="text-zinc-500 uppercase">SCHEDULED</span>
                                                                )}
                                                            </div>

                                                            <div className="text-sm font-bold text-white leading-tight">
                                                                <div>{teamAName}</div>
                                                                <div className="text-lime-400 font-mono text-xs my-0.5">VS</div>
                                                                <div>{teamBName}</div>
                                                            </div>

                                                            <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                                                                {isMatchScheduled ? (
                                                                    <div className="flex items-center gap-1.5 text-lime-300 font-mono">
                                                                        <span className="font-bold">{match.court?.name}</span>
                                                                        <span>•</span>
                                                                        <span>{extractHHmm(match.scheduled_time)} WIB</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-zinc-500 italic text-[11px]">
                                                                        Court &amp; waktu belum ditentukan
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Footer: Tombol Generate / Regenerate */}
                                    {roundItem.exists && (
                                        <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="text-xs text-zinc-400">
                                                {roundItem.hasStarted ? (
                                                    <span className="inline-flex items-center gap-1.5 text-amber-300 font-mono text-[11px]">
                                                        <Lock className="w-3.5 h-3.5" />
                                                        Jadwal terkunci (pertandingan live atau selesai)
                                                    </span>
                                                ) : roundItem.isScheduled ? (
                                                    <span className="text-zinc-400 text-[11px]">
                                                        Jadwal sudah ditetapkan. Anda dapat regenerate jika ingin mengatur ulang slot.
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-300 text-[11px]">
                                                        Pertandingan siap dijadwalkan ke lapangan yang tersedia.
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                {roundItem.canGenerate && !roundItem.isScheduled ? (
                                                    <Button
                                                        type="button"
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleGenerateRound(roundItem.round)}
                                                        disabled={isGeneratingKnockout}
                                                        className="w-full sm:w-auto font-bold flex items-center justify-center gap-2"
                                                    >
                                                        {isGeneratingThis ? (
                                                            <RotateCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Calendar className="w-4 h-4" />
                                                        )}
                                                        <span>Generate Jadwal {roundItem.title}</span>
                                                    </Button>
                                                ) : roundItem.canGenerate && roundItem.isScheduled ? (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleGenerateRound(roundItem.round)}
                                                        disabled={isGeneratingKnockout}
                                                        className="w-full sm:w-auto text-zinc-300 hover:text-white flex items-center justify-center gap-2 text-xs"
                                                    >
                                                        {isGeneratingThis ? (
                                                            <RotateCw className="w-3.5 h-3.5 animate-spin text-lime-400" />
                                                        ) : (
                                                            <RotateCw className="w-3.5 h-3.5" />
                                                        )}
                                                        <span>Regenerate Jadwal {roundItem.title}</span>
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Timetable Grid Lapangan Keseluruhan */}
            {selectedCategoryId && knockoutData?.courts && knockoutData.courts.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                                Grid Jadwal Seluruh Lapangan Turnamen
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Pantau slot waktu yang ditempati match babak grup dan penempatan babak knockout.
                            </p>
                        </div>
                    </div>

                    <ScheduleGridView
                        courts={knockoutData.courts}
                        scheduledMatches={knockoutData.scheduledMatches}
                        occupiedSlots={knockoutData.occupiedSlots}
                        startTime={knockoutData.settings?.daily_start_time?.slice(0, 5)}
                        endTime={knockoutData.settings?.daily_end_time?.slice(0, 5)}
                        durationMinutes={knockoutData.settings?.match_duration_minutes}
                    />
                </div>
            )}
        </div>
    )
}
