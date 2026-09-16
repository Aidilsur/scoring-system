'use client'

import React, { useState, useEffect } from 'react'
import {
    Trophy,
    Clock,
    Flame,
    Maximize,
    Minimize,
    ArrowRight,
} from 'lucide-react'
import { PadelCourtGeometry } from './PadelCourtGeometry'
import { CourtDisplayEmptyState } from './CourtDisplayEmptyState'
import { CourtDisplayScoreBoard } from './CourtDisplayScoreBoard'
import { useCourtLiveDisplay } from '@/hooks/useCourtLiveDisplay'
import { ROUND_LABELS } from '@/lib/scoring'
import type { MatchRound } from '@/types/domain'

interface CourtLiveDisplayProps {
    courtId: string
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

export function CourtLiveDisplay({ courtId }: CourtLiveDisplayProps) {
    const {
        court,
        match,
        nextMatch,
        status,
        servingTeam,
        isTiebreak,
        currentTime,
        isLoading,
        autoAdvanceCountdown,
        skipToNextMatch,
    } = useCourtLiveDisplay(courtId)

    const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

    // Deteksi status fullscreen browser
    useEffect(() => {
        function handleFullscreenChange() {
            setIsFullscreen(Boolean(document.fullscreenElement))
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {})
        } else {
            document.exitFullscreen().catch(() => {})
        }
    }

    const courtName = court?.name || 'COURT'

    // 1. Loading State
    if (isLoading && !match) {
        return (
            <div
                className="min-h-screen h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 relative overflow-hidden"
            >
                <PadelCourtGeometry />
                <div className="relative z-10 text-center space-y-4">
                    <div
                        className="w-12 h-12 border-3 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-lime-400/20"
                    />
                    <div className="space-y-1">
                        <div
                            className="text-xl font-[family-name:var(--font-anton)] text-white uppercase tracking-wider"
                        >
                            Memuat Layar {courtName}...
                        </div>
                        <p className="text-xs font-mono text-zinc-400">
                            Menghubungkan ke Supabase Realtime Broadcast
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // 2. Empty State: Belum ada match aktif maupun terjadwal
    if (status === 'empty' || !match) {
        return (
            <CourtDisplayEmptyState
                courtName={courtName}
                currentTime={currentTime}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
            />
        )
    }

    const isLive = match.status === 'live'
    const isCompleted = match.status === 'completed'
    const isScheduled = match.status === 'scheduled'
    const roundLabel = ROUND_LABELS[match.round as MatchRound] || match.round

    return (
        <div
            className="min-h-screen h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-10 relative overflow-hidden select-none"
        >
            {/* Background Geometric Lines */}
            <PadelCourtGeometry />

            {/* 1. TOP BROADCAST HEADER */}
            <header
                className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-3 sm:pb-4 border-b border-zinc-800/80"
            >
                {/* Court & Category Badge */}
                <div className="space-y-0.5">
                    <div
                        className="flex items-center gap-2 text-xs font-mono tracking-wider text-lime-400 font-bold uppercase"
                    >
                        <span>{match.category?.name || 'PADEL TOURNAMENT'}</span>
                        <span>•</span>
                        <span>{roundLabel}</span>
                        {match.group?.name && (
                            <>
                                <span>•</span>
                                <span>{match.group.name}</span>
                            </>
                        )}
                    </div>
                    <h1
                        className="text-3xl sm:text-4xl md:text-5xl font-[family-name:var(--font-anton)] text-white uppercase tracking-tight flex items-center gap-2"
                    >
                        {courtName}
                    </h1>
                </div>

                {/* Center Status Pill */}
                <div className="flex items-center gap-2">
                    {isLive && (
                        <div
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-black uppercase tracking-widest bg-lime-400/20 text-lime-400 border border-lime-400/60 shadow-lg shadow-lime-400/20 animate-pulse"
                        >
                            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping" />
                            LIVE MATCH
                        </div>
                    )}

                    {isScheduled && (
                        <div
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-sm"
                        >
                            <Clock className="w-4 h-4 text-zinc-400" />
                            <span>
                                MENUNGGU DIMULAI ({formatTime(match.scheduled_time)} WIB)
                            </span>
                        </div>
                    )}

                    {isCompleted && (
                        <div
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm"
                        >
                            <Trophy className="w-4 h-4 text-emerald-400" />
                            <span>PERTANDINGAN SELESAI</span>
                        </div>
                    )}

                    {/* Tiebreak / Golden Game Indicator */}
                    {isTiebreak && isLive && (
                        <div
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse"
                        >
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                                {match.round === 'group'
                                    ? 'TIEBREAK (2-2)'
                                    : 'GOLDEN GAME (5-5)'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Clock & Fullscreen Button */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div
                            className="text-sm sm:text-base md:text-lg font-mono font-bold text-zinc-200 tracking-wider"
                        >
                            {currentTime}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (F11)'}
                        className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
                    >
                        {isFullscreen ? (
                            <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                            <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                    </button>
                </div>
            </header>

            {/* 2. MAIN BROADCAST LIVE SCORE CARD */}
            <CourtDisplayScoreBoard
                match={match}
                servingTeam={servingTeam}
                isTiebreak={isTiebreak}
            />

            {/* 3. BOTTOM BROADCAST FOOTER */}
            <footer className="relative z-10 border-t border-zinc-800/80 pt-3 sm:pt-4">
                {/* AUTO-ADVANCE BANNER JIKA MATCH SELESAI */}
                {isCompleted && autoAdvanceCountdown !== null && (
                    <div
                        className="mb-3 p-3 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-between gap-3 text-lime-300"
                    >
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                            <span>
                                Pertandingan selesai. Pindah ke match berikutnya dalam{' '}
                                <strong className="text-white text-sm">
                                    {autoAdvanceCountdown}s
                                </strong>
                                ...
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={skipToNextMatch}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-lime-400 text-zinc-950 hover:bg-lime-300 transition-colors"
                        >
                            <span>Lanjut Sekarang</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* TICKER NEXT MATCH / SPONSOR BAR */}
                <div
                    className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-zinc-400"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 uppercase tracking-wider">
                            JADWAL BERIKUTNYA:
                        </span>
                        {nextMatch ? (
                            <span className="text-white font-bold">
                                {nextMatch.team_a?.player1_name}/{nextMatch.team_a?.player2_name}{' '}
                                vs{' '}
                                {nextMatch.team_b?.player1_name}/{nextMatch.team_b?.player2_name}{' '}
                                ({formatTime(nextMatch.scheduled_time)} WIB)
                            </span>
                        ) : (
                            <span className="text-zinc-500">
                                Tidak ada jadwal pertandingan berikutnya di court ini
                            </span>
                        )}
                    </div>

                    <div className="text-zinc-500 text-[11px] font-mono flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                        <span>PADEL TOURNAMENT BROADCAST • REALTIME SYNC</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
