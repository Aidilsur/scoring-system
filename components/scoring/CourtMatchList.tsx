'use client'

import React from 'react'
import { Play, Clock } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { ROUND_LABELS, MATCH_STATUS_CONFIG } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/domain'

interface CourtMatchListProps {
    matches: Match[]
    currentMatch: Match | null
    onSelectMatch: (matchId: string) => void
    courtName?: string
}

function formatTime(isoStr?: string | null): string {
    if (!isoStr) return '--:--'
    try {
        if (isoStr.includes('T')) {
            return isoStr.split('T')[1].slice(0, 5)
        }
        return isoStr.slice(0, 5)
    } catch {
        return '--:--'
    }
}

/**
 * CourtMatchList: Daftar pertandingan yang dijadwalkan pada court terpilih
 * Menyoroti match yang sedang live atau giliran berikutnya
 */
export function CourtMatchList({
    matches,
    currentMatch,
    onSelectMatch,
    courtName = 'Court',
}: CourtMatchListProps) {
    if (!matches || matches.length === 0) {
        return (
            <div
                className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3"
            >
                <div
                    className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto"
                >
                    <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Belum Ada Pertandingan Terjadwal
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Tidak ada pertandingan aktif atau terjadwal di {courtName}. Silakan atur jadwal di menu Penjadwalan (/admin/schedule).
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Highlight Banner untuk Match Saat Ini */}
            {currentMatch && (
                <div
                    className="p-5 rounded-2xl bg-emerald-950/40 border-2 border-lime-400/80 shadow-xl shadow-lime-400/5 space-y-4"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
                            <span
                                className="text-xs font-bold uppercase tracking-widest text-lime-400"
                            >
                                {currentMatch.status === 'live'
                                    ? 'SEDANG BERLANGSUNG'
                                    : 'PERTANDINGAN BERIKUTNYA'}
                            </span>
                        </div>
                        <Badge variant="neutral" size="sm">
                            {formatTime(currentMatch.scheduled_time)} WIB
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="space-y-1">
                            <div
                                className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider"
                            >
                                {currentMatch.category?.name} •{' '}
                                {ROUND_LABELS[currentMatch.round] || currentMatch.round}
                            </div>
                            <div
                                className="text-base sm:text-lg font-bold text-white leading-tight"
                            >
                                <span>
                                    {currentMatch.team_a?.player1_name} / {currentMatch.team_a?.player2_name}
                                </span>
                                <span className="text-lime-400 mx-2 text-sm font-mono">VS</span>
                                <span>
                                    {currentMatch.team_b?.player1_name} / {currentMatch.team_b?.player2_name}
                                </span>
                            </div>
                            <div className="text-xs text-zinc-400">
                                Skor Game:{' '}
                                <span className="text-white font-bold">{currentMatch.games_team_a}</span>
                                {' - '}
                                <span className="text-white font-bold">{currentMatch.games_team_b}</span>
                                {currentMatch.status === 'live' && (
                                    <span className="ml-2 text-lime-400 font-mono font-bold">
                                        (Poin: {currentMatch.current_point_a || '0'} - {currentMatch.current_point_b || '0'})
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-start md:justify-end">
                            <Button
                                onClick={() => onSelectMatch(currentMatch.id)}
                                variant="primary"
                                size="md"
                                className="w-full sm:w-auto font-black flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                {currentMatch.status === 'live'
                                    ? 'Lanjutkan Scoring'
                                    : 'Mulai Scoring Sekarang'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* List Semua Match di Court ini */}
            <div className="space-y-2">
                <div
                    className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1"
                >
                    Seluruh Jadwal di {courtName} ({matches.length} Match)
                </div>

                <div className="space-y-2">
                    {matches.map((match) => {
                        const isCompleted = match.status === 'completed'
                        const isLive = match.status === 'live'
                        const isCurrent = currentMatch?.id === match.id
                        const statusConfig =
                            MATCH_STATUS_CONFIG[match.status] || MATCH_STATUS_CONFIG.scheduled
                        const StatusIcon = statusConfig.icon

                        return (
                            <div
                                key={match.id}
                                className={cn(
                                    'p-4 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                                    isLive
                                        ? 'bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-zinc-900 border-2 border-lime-400 shadow-lg shadow-lime-400/10'
                                        : isCurrent
                                        ? 'bg-zinc-900 border-lime-400/50'
                                        : isCompleted
                                        ? 'bg-zinc-900/40 border border-zinc-800/80 opacity-75'
                                        : 'bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700'
                                )}
                            >
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Status Badge: SCHEDULED / LIVE / COMPLETED */}
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono uppercase tracking-wider',
                                                statusConfig.badgeClass
                                            )}
                                        >
                                            {isLive ? (
                                                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                                            ) : (
                                                <StatusIcon className="w-3 h-3" />
                                            )}
                                            {statusConfig.label}
                                        </span>

                                        <span className="text-xs font-mono text-zinc-400">
                                            {formatTime(match.scheduled_time)} WIB
                                        </span>
                                        <span className="text-zinc-600">•</span>
                                        <span className="text-xs font-medium text-zinc-300">
                                            {match.category?.name} ({ROUND_LABELS[match.round] || match.round})
                                        </span>
                                    </div>

                                    <div className="text-sm sm:text-base font-bold text-white">
                                        {match.team_a?.player1_name}/{match.team_a?.player2_name}
                                        <span className="text-zinc-500 mx-2 font-mono font-normal">
                                            vs
                                        </span>
                                        {match.team_b?.player1_name}/{match.team_b?.player2_name}
                                    </div>

                                    <div className="text-xs text-zinc-400">
                                        Skor Game:{' '}
                                        <span className="text-white font-mono font-bold">
                                            {match.games_team_a} - {match.games_team_b}
                                        </span>
                                        {isLive && (
                                            <span className="text-lime-400 font-mono font-bold ml-2">
                                                (Poin: {match.current_point_a || '0'}-{match.current_point_b || '0'})
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Button
                                        onClick={() => onSelectMatch(match.id)}
                                        variant={isLive ? 'primary' : 'secondary'}
                                        size="sm"
                                        className={cn(
                                            'w-full sm:w-auto text-xs font-bold flex items-center justify-center gap-1.5',
                                            isLive && 'shadow-md shadow-lime-400/20'
                                        )}
                                    >
                                        {isLive ? (
                                            <>
                                                <Play className="w-3.5 h-3.5 fill-current" />
                                                Lanjutkan Scoring
                                            </>
                                        ) : isCompleted ? (
                                            'Lihat / Edit Skor'
                                        ) : (
                                            'Mulai Scoring'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
