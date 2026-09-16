'use client'

import React from 'react'
import Link from 'next/link'
import {
    Zap,
    Clock,
    Trophy,
    Calendar,
    ChevronRight,
    CircleDot,
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ROUND_LABELS } from '@/lib/scoring'
import type { MatchRound } from '@/types/domain'
import type { CourtOverviewItem } from '@/hooks/useCourtsOverviewQuery'

interface CourtOverviewCardProps {
    item: CourtOverviewItem
}

function formatScheduleTime(isoString?: string | null): string {
    if (!isoString) return 'Sesuai Urutan'
    try {
        const date = new Date(isoString)
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }) + ' WIB'
    } catch {
        return 'Sesuai Urutan'
    }
}

/**
 * CourtOverviewCard
 * Kartu status individu untuk 1 lapangan pada halaman multi-court overview (/display/courts).
 * Menampilkan status LIVE (dengan skor poin & game real-time), SCHEDULED, atau COMPLETED.
 * Dapat diklik untuk membuka TV Display spesifik lapangan tersebut (/display/court/[courtId]).
 */
export function CourtOverviewCard({ item }: CourtOverviewCardProps) {
    const { court, status, liveMatch, nextScheduledMatch, lastCompletedMatch } = item

    // ==========================================
    // 1. STATE: MATCH SEDANG LIVE
    // ==========================================
    if (status === 'live' && liveMatch) {
        const teamAName =
            `${liveMatch.team_a?.player1_name || 'Tim A'} / ${liveMatch.team_a?.player2_name || ''}`.trim()
        const teamBName =
            `${liveMatch.team_b?.player1_name || 'Tim B'} / ${liveMatch.team_b?.player2_name || ''}`.trim()

        return (
            <Link
                href={`/display/court/${court.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900/90 border-2 border-lime-500/40 hover:border-lime-400 p-5 sm:p-6 transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl hover:shadow-lime-950/40"
            >
                {/* Ambient glow efek aktif */}
                <div
                    className="absolute -top-16 -right-16 w-36 h-36 bg-lime-400/10 rounded-full blur-2xl pointer-events-none group-hover:bg-lime-400/20 transition-all duration-500"
                />

                {/* Header Card */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <span
                            className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-white uppercase tracking-wide"
                        >
                            {court.name}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-lime-400/15 border border-lime-400/30 text-lime-400 shadow-sm shadow-lime-400/10"
                        >
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse mr-1.5" />
                            LIVE
                        </span>
                    </div>
                </div>

                {/* Metadata Pertandingan */}
                <div className="pt-3 pb-4">
                    <div
                        className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-lime-400 font-semibold mb-3"
                    >
                        <span>{liveMatch.category?.name || 'Tournament'}</span>
                        <span>•</span>
                        <span>{ROUND_LABELS[liveMatch.round as MatchRound] || liveMatch.round}</span>
                        {liveMatch.group?.name && (
                            <>
                                <span>•</span>
                                <span>{liveMatch.group.name}</span>
                            </>
                        )}
                    </div>

                    {/* Papan Skor Baris Tim A & B */}
                    <div className="space-y-2.5 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/80">
                        {/* Tim A */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p
                                    className="font-bold text-sm sm:text-base text-zinc-100 truncate group-hover:text-white transition-colors"
                                >
                                    {teamAName}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span
                                    className="font-mono text-sm font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded"
                                >
                                    {liveMatch.games_team_a}
                                </span>
                                <span
                                    className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-lime-400 w-10 text-right"
                                >
                                    {liveMatch.current_point_a || '0'}
                                </span>
                            </div>
                        </div>

                        {/* Divider halus */}
                        <div className="h-px bg-zinc-800/50" />

                        {/* Tim B */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <p
                                    className="font-bold text-sm sm:text-base text-zinc-100 truncate group-hover:text-white transition-colors"
                                >
                                    {teamBName}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span
                                    className="font-mono text-sm font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded"
                                >
                                    {liveMatch.games_team_b}
                                </span>
                                <span
                                    className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-lime-400 w-10 text-right"
                                >
                                    {liveMatch.current_point_b || '0'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div
                    className="pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400 group-hover:text-lime-400 transition-colors"
                >
                    <span className="font-mono flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-lime-400" />
                        Live Scoring Sedang Berlangsung
                    </span>
                    <span className="font-bold inline-flex items-center gap-1">
                        Buka Layar TV
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </Link>
        )
    }

    // ==========================================
    // 2. STATE: MENUNGGU JADWAL BERIKUTNYA
    // ==========================================
    if (status === 'scheduled' && nextScheduledMatch) {
        const teamAPlayer1 = nextScheduledMatch.team_a?.player1_name || 'Tim A'
        const teamAPlayer2 = nextScheduledMatch.team_a?.player2_name || ''
        const teamAName = `${teamAPlayer1} / ${teamAPlayer2}`.trim()

        const teamBPlayer1 = nextScheduledMatch.team_b?.player1_name || 'Tim B'
        const teamBPlayer2 = nextScheduledMatch.team_b?.player2_name || ''
        const teamBName = `${teamBPlayer1} / ${teamBPlayer2}`.trim()

        const matchTime = formatScheduleTime(nextScheduledMatch.scheduled_time)
        const roundLabel =
            ROUND_LABELS[nextScheduledMatch.round as MatchRound] ||
            nextScheduledMatch.round

        return (
            <Link
                href={`/display/court/${court.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 p-5 sm:p-6 transition-all duration-300 hover:scale-[1.015] hover:bg-zinc-900"
            >
                {/* Header Card */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <span
                            className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-zinc-200 uppercase tracking-wide group-hover:text-white transition-colors"
                        >
                            {court.name}
                        </span>
                    </div>

                    <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-zinc-400 bg-zinc-800/90 border border-zinc-700/80"
                    >
                        <Clock className="w-3 h-3 mr-1 text-zinc-400" />
                        MENUNGGU
                    </span>
                </div>

                {/* Metadata Pertandingan Terjadwal */}
                <div className="pt-3 pb-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span className="uppercase text-zinc-300">
                            {nextScheduledMatch.category?.name || 'Tournament'} • {roundLabel}
                        </span>
                        <span
                            className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                        >
                            {matchTime}
                        </span>
                    </div>

                    <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/50 space-y-1.5">
                        <div className="text-sm font-semibold text-zinc-200 truncate">
                            {teamAName}
                        </div>
                        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                            VS
                        </div>
                        <div className="text-sm font-semibold text-zinc-200 truncate">
                            {teamBName}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div
                    className="pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors"
                >
                    <span className="font-mono flex items-center gap-1.5 text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        Jadwal Pertandingan Berikutnya
                    </span>
                    <span className="font-bold inline-flex items-center gap-1">
                        Buka Monitor
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </Link>
        )
    }

    // ==========================================
    // 3. STATE: SEMUA MATCH SELESAI
    // ==========================================
    if (status === 'completed' && lastCompletedMatch) {
        const teamAPlayer1 = lastCompletedMatch.team_a?.player1_name || 'Tim A'
        const teamAPlayer2 = lastCompletedMatch.team_a?.player2_name || ''
        const teamAName = `${teamAPlayer1} / ${teamAPlayer2}`.trim()

        const teamBPlayer1 = lastCompletedMatch.team_b?.player1_name || 'Tim B'
        const teamBPlayer2 = lastCompletedMatch.team_b?.player2_name || ''
        const teamBName = `${teamBPlayer1} / ${teamBPlayer2}`.trim()

        const isWinnerA =
            lastCompletedMatch.winner_team_id === lastCompletedMatch.team_a_id

        return (
            <Link
                href={`/display/court/${court.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 p-5 sm:p-6 transition-all duration-300 hover:scale-[1.015]"
            >
                {/* Header Card */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <span
                            className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-zinc-300 uppercase tracking-wide group-hover:text-white transition-colors"
                        >
                            {court.name}
                        </span>
                    </div>

                    <Badge variant="success" size="sm">
                        <Trophy className="w-3 h-3 mr-1" />
                        SELESAI
                    </Badge>
                </div>

                {/* Hasil Match Terakhir */}
                <div className="pt-3 pb-4 space-y-2">
                    <div className="text-[11px] font-mono text-zinc-400">
                        Match Terakhir • {lastCompletedMatch.category?.name || 'Tournament'}
                    </div>

                    <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/60 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={cn(
                                    'text-xs sm:text-sm font-semibold truncate',
                                    {
                                        'text-lime-400 font-bold': isWinnerA,
                                        'text-zinc-400': !isWinnerA,
                                    }
                                )}
                            >
                                {teamAName} {isWinnerA && '★'}
                            </span>
                            <span className="font-mono text-sm font-bold text-white">
                                {lastCompletedMatch.games_team_a}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={cn(
                                    'text-xs sm:text-sm font-semibold truncate',
                                    {
                                        'text-lime-400 font-bold': !isWinnerA,
                                        'text-zinc-400': isWinnerA,
                                    }
                                )}
                            >
                                {teamBName} {!isWinnerA && '★'}
                            </span>
                            <span className="font-mono text-sm font-bold text-white">
                                {lastCompletedMatch.games_team_b}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div
                    className="pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors"
                >
                    <span className="font-mono text-zinc-400">
                        Tidak ada jadwal lanjutan
                    </span>
                    <span className="font-bold inline-flex items-center gap-1">
                        Buka Layar
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </Link>
        )
    }

    // ==========================================
    // 4. STATE: KOSONG / BELUM ADA JADWAL
    // ==========================================
    return (
        <Link
            href={`/display/court/${court.id}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900/40 border border-zinc-800/60 border-dashed hover:border-zinc-700 p-5 sm:p-6 transition-all duration-300 hover:bg-zinc-900/60"
        >
            {/* Header Card */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
                <span
                    className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-zinc-400 uppercase tracking-wide group-hover:text-white transition-colors"
                >
                    {court.name}
                </span>

                <span
                    className="text-xs font-mono font-bold text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-800"
                >
                    TIDAK ADA JADWAL
                </span>
            </div>

            {/* Empty State Description */}
            <div className="py-8 text-center space-y-1">
                <CircleDot className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-300">
                    Tidak ada jadwal
                </p>
                <p className="text-xs text-zinc-500">
                    Belum ada pertandingan terjadwal di lapangan ini
                </p>
            </div>

            {/* Footer Action */}
            <div
                className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors"
            >
                <span className="font-mono text-zinc-400">Menunggu Penjadwalan</span>
                <span className="font-bold inline-flex items-center gap-1">
                    Buka Monitor
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
            </div>
        </Link>
    )
}
