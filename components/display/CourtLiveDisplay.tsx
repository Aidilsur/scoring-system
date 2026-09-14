'use client'

import React, { useState, useEffect } from 'react'
import {
    CircleDot,
    Trophy,
    Clock,
    Flame,
    Maximize,
    Minimize,
    ArrowRight,
    Layers,
} from 'lucide-react'
import { PadelCourtGeometry } from './PadelCourtGeometry'
import { useCourtLiveDisplay } from '@/hooks/useCourtLiveDisplay'
import type { Match } from '@/types/domain'

export interface CourtLiveDisplayProps {
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

function getRoundLabel(round?: string): string {
    switch (round) {
        case 'group':
            return 'Penyisihan Grup'
        case 'semifinal':
            return 'Semifinal'
        case 'final':
            return 'Final'
        case 'third_place':
            return 'Perebutan Juara 3'
        default:
            return round || 'Pertandingan'
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
            <div className="min-h-screen h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <PadelCourtGeometry />
                <div className="relative z-10 text-center space-y-4">
                    <div className="w-12 h-12 border-3 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-lime-400/20" />
                    <div className="space-y-1">
                        <div className="text-xl font-[family-name:var(--font-anton)] text-white uppercase tracking-wider">
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
            <div className="min-h-screen h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-10 md:p-14 relative overflow-hidden select-none">
                <PadelCourtGeometry />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-4">
                    <div>
                        <span className="text-xs font-mono text-lime-400 uppercase tracking-widest font-bold">
                            TV DISPLAY LAPANGAN
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-[family-name:var(--font-anton)] text-white uppercase tracking-tight">
                            {courtName}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm sm:text-base font-mono font-bold text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800">
                            {currentTime}
                        </span>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            title="Layar Penuh (F11)"
                            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Center Empty Message */}
                <div className="relative z-10 max-w-lg mx-auto text-center space-y-5 p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-2xl backdrop-blur-md">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto border border-zinc-700/50 shadow-inner">
                        <Layers className="w-8 h-8 text-lime-400/80" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-[family-name:var(--font-anton)] text-white uppercase tracking-wider">
                            Belum Ada Pertandingan di Court Ini
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
                            Jadwal pertandingan akan otomatis muncul di layar ini setelah ditetapkan atau dimulai oleh panitia turnamen.
                        </p>
                    </div>
                    <div className="pt-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                            STANDBY REALTIME
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/80 pt-4 font-mono">
                    <span>PADEL TOURNAMENT SCORING SYSTEM</span>
                    <span>LIVE TV BROADCAST</span>
                </div>
            </div>
        )
    }

    const isLive = match.status === 'live'
    const isCompleted = match.status === 'completed'
    const isScheduled = match.status === 'scheduled'

    const teamAPlayer1 = match.team_a?.player1_name || 'Pemain 1'
    const teamAPlayer2 = match.team_a?.player2_name || 'Pemain 2'
    const teamBPlayer1 = match.team_b?.player1_name || 'Pemain 1'
    const teamBPlayer2 = match.team_b?.player2_name || 'Pemain 2'

    const isTeamAWinner = isCompleted && match.winner_team_id === match.team_a_id
    const isTeamBWinner = isCompleted && match.winner_team_id === match.team_b_id

    const isTeamAServing = isLive && servingTeam === 'team_a'
    const isTeamBServing = isLive && servingTeam === 'team_b'

    return (
        <div className="min-h-screen h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-10 relative overflow-hidden select-none">
            {/* Background Geometric Lines */}
            <PadelCourtGeometry />

            {/* 1. TOP BROADCAST HEADER */}
            <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-3 sm:pb-4 border-b border-zinc-800/80">
                {/* Court & Category Badge */}
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-lime-400 font-bold uppercase">
                        <span>{match.category?.name || 'PADEL TOURNAMENT'}</span>
                        <span>•</span>
                        <span>{getRoundLabel(match.round)}</span>
                        {match.group?.name && (
                            <>
                                <span>•</span>
                                <span>{match.group.name}</span>
                            </>
                        )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-[family-name:var(--font-anton)] text-white uppercase tracking-tight flex items-center gap-2">
                        {courtName}
                    </h1>
                </div>

                {/* Center Status Pill */}
                <div className="flex items-center gap-2">
                    {isLive && (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-black uppercase tracking-widest bg-lime-400/20 text-lime-400 border border-lime-400/60 shadow-lg shadow-lime-400/20 animate-pulse">
                            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-ping" />
                            LIVE MATCH
                        </div>
                    )}

                    {isScheduled && (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-sm">
                            <Clock className="w-4 h-4 text-zinc-400" />
                            <span>MENUNGGU DIMULAI ({formatTime(match.scheduled_time)} WIB)</span>
                        </div>
                    )}

                    {isCompleted && (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm">
                            <Trophy className="w-4 h-4 text-emerald-400" />
                            <span>PERTANDINGAN SELESAI</span>
                        </div>
                    )}

                    {/* Tiebreak / Golden Game Indicator */}
                    {isTiebreak && isLive && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <span>{match.round === 'group' ? 'TIEBREAK (2-2)' : 'GOLDEN GAME (5-5)'}</span>
                        </div>
                    )}
                </div>

                {/* Right Clock & Fullscreen Button */}
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-sm sm:text-base md:text-lg font-mono font-bold text-zinc-200 tracking-wider">
                            {currentTime}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (F11)'}
                        className="p-2 sm:p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
                    >
                        {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                </div>
            </header>

            {/* 2. MAIN BROADCAST LIVE SCORE CARD (FOKUS 1 MATCH) */}
            <main className="relative z-10 flex-1 my-auto flex flex-col justify-center max-w-7xl mx-auto w-full py-4 sm:py-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center">
                    {/* KOLOM TIM A (KIRI) */}
                    <div
                        className={`md:col-span-4 p-6 sm:p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between min-h-[220px] sm:min-h-[260px] md:min-h-[300px] border-2 ${
                            isTeamAWinner
                                ? 'bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-900 border-lime-400 shadow-2xl shadow-lime-400/20'
                                : isTeamAServing
                                ? 'bg-zinc-900/90 border-lime-400/90 ring-4 ring-lime-400/20 shadow-2xl shadow-lime-400/10'
                                : 'bg-zinc-900/70 border-zinc-800/80'
                        }`}
                    >
                        {/* Header Kartu Tim A: Serve / Winner Badge */}
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                                TIM A
                            </span>

                            {isTeamAServing && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/30 animate-pulse">
                                    <CircleDot className="w-3.5 h-3.5 fill-current" />
                                    SERVE
                                </span>
                            )}

                            {isTeamAWinner && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/40">
                                    <Trophy className="w-3.5 h-3.5" />
                                    PEMENANG
                                </span>
                            )}
                        </div>

                        {/* Nama Pemain Tim A */}
                        <div className="my-auto py-3 space-y-1">
                            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight line-clamp-1">
                                {teamAPlayer1}
                            </div>
                            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-300 tracking-tight leading-tight line-clamp-1">
                                {teamAPlayer2}
                            </div>
                        </div>

                        {/* Game Won Tim A */}
                        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-400">
                            <span>GAME DIMENANGKAN</span>
                            <span className="text-xl font-bold text-white">{match.games_team_a}</span>
                        </div>
                    </div>

                    {/* KOLOM TENGAH: SKOR POIN RAKSASA & GAME SCORE */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6">
                        {/* SKOR POIN BESAR */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-center gap-3 sm:gap-6">
                                <span className="font-[family-name:var(--font-anton)] text-7xl sm:text-8xl md:text-9xl lg:text-[10vw] font-black text-lime-400 tracking-tight leading-none drop-shadow-[0_0_35px_rgba(163,230,53,0.3)]">
                                    {match.current_point_a || '0'}
                                </span>
                                <span className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-zinc-600 leading-none pb-2">
                                    :
                                </span>
                                <span className="font-[family-name:var(--font-anton)] text-7xl sm:text-8xl md:text-9xl lg:text-[10vw] font-black text-lime-400 tracking-tight leading-none drop-shadow-[0_0_35px_rgba(163,230,53,0.3)]">
                                    {match.current_point_b || '0'}
                                </span>
                            </div>

                            <div className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                                {isTiebreak ? 'POIN TIEBREAK (RACE TO 7)' : 'SKOR POIN GAME'}
                            </div>
                        </div>

                        {/* REKAP SKOR GAME PERTANDINGAN */}
                        <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 w-full max-w-xs shadow-xl backdrop-blur-sm">
                            <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1">
                                SKOR GAME
                            </div>
                            <div className="text-3xl sm:text-4xl font-[family-name:var(--font-anton)] text-white tracking-wider flex items-center justify-center gap-3">
                                <span>{match.games_team_a}</span>
                                <span className="text-zinc-600 text-2xl font-sans">-</span>
                                <span>{match.games_team_b}</span>
                            </div>
                            <div className="text-[10px] font-mono text-lime-400 mt-1">
                                {match.round === 'group' ? 'Target: 3 Game (Best of 5)' : 'Target: 6 Game (First to 6)'}
                            </div>
                        </div>
                    </div>

                    {/* KOLOM TIM B (KANAN) */}
                    <div
                        className={`md:col-span-4 p-6 sm:p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between min-h-[220px] sm:min-h-[260px] md:min-h-[300px] border-2 text-right ${
                            isTeamBWinner
                                ? 'bg-gradient-to-bl from-emerald-950/80 via-zinc-900 to-zinc-900 border-lime-400 shadow-2xl shadow-lime-400/20'
                                : isTeamBServing
                                ? 'bg-zinc-900/90 border-lime-400/90 ring-4 ring-lime-400/20 shadow-2xl shadow-lime-400/10'
                                : 'bg-zinc-900/70 border-zinc-800/80'
                        }`}
                    >
                        {/* Header Kartu Tim B: Serve / Winner Badge */}
                        <div className="flex items-center justify-between flex-row-reverse gap-2">
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                                TIM B
                            </span>

                            {isTeamBServing && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/30 animate-pulse">
                                    <CircleDot className="w-3.5 h-3.5 fill-current" />
                                    SERVE
                                </span>
                            )}

                            {isTeamBWinner && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/40">
                                    <Trophy className="w-3.5 h-3.5" />
                                    PEMENANG
                                </span>
                            )}
                        </div>

                        {/* Nama Pemain Tim B */}
                        <div className="my-auto py-3 space-y-1">
                            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight line-clamp-1">
                                {teamBPlayer1}
                            </div>
                            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-300 tracking-tight leading-tight line-clamp-1">
                                {teamBPlayer2}
                            </div>
                        </div>

                        {/* Game Won Tim B */}
                        <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-400 flex-row-reverse">
                            <span>GAME DIMENANGKAN</span>
                            <span className="text-xl font-bold text-white">{match.games_team_b}</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* 3. BOTTOM BROADCAST FOOTER */}
            <footer className="relative z-10 border-t border-zinc-800/80 pt-3 sm:pt-4">
                {/* AUTO-ADVANCE BANNER JIKA MATCH SELESAI */}
                {isCompleted && autoAdvanceCountdown !== null && (
                    <div className="mb-3 p-3 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-between gap-3 text-lime-300">
                        <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                            <span>
                                Pertandingan selesai. Pindah ke match berikutnya dalam{' '}
                                <strong className="text-white text-sm">{autoAdvanceCountdown}s</strong>...
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 uppercase tracking-wider">JADWAL BERIKUTNYA:</span>
                        {nextMatch ? (
                            <span className="text-white font-bold">
                                {nextMatch.team_a?.player1_name}/{nextMatch.team_a?.player2_name} vs{' '}
                                {nextMatch.team_b?.player1_name}/{nextMatch.team_b?.player2_name} ({formatTime(nextMatch.scheduled_time)} WIB)
                            </span>
                        ) : (
                            <span className="text-zinc-500">Tidak ada jadwal pertandingan berikutnya di court ini</span>
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
