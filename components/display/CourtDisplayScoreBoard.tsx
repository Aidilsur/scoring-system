import React from 'react'
import { CircleDot, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/domain'
import type { MatchTeam } from '@/lib/scoring'

interface CourtDisplayScoreBoardProps {
    match: Match
    servingTeam: MatchTeam
    isTiebreak: boolean
}

/**
 * CourtDisplayScoreBoard
 * Komponen presentational untuk papan skor 3 kolom (Tim A, Skor Poin & Game, Tim B)
 * pada TV Live Display lapangan.
 */
export function CourtDisplayScoreBoard({
    match,
    servingTeam,
    isTiebreak,
}: CourtDisplayScoreBoardProps) {
    const isLive = match.status === 'live'
    const isCompleted = match.status === 'completed'

    const teamAPlayer1 = match.team_a?.player1_name || 'Pemain 1'
    const teamAPlayer2 = match.team_a?.player2_name || 'Pemain 2'
    const teamBPlayer1 = match.team_b?.player1_name || 'Pemain 1'
    const teamBPlayer2 = match.team_b?.player2_name || 'Pemain 2'

    const isTeamAWinner = isCompleted && match.winner_team_id === match.team_a_id
    const isTeamBWinner = isCompleted && match.winner_team_id === match.team_b_id

    const isTeamAServing = isLive && servingTeam === 'team_a'
    const isTeamBServing = isLive && servingTeam === 'team_b'

    return (
        <main
            className="relative z-10 flex-1 my-auto flex flex-col justify-center max-w-7xl mx-auto w-full py-4 sm:py-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center">
                {/* KOLOM TIM A (KIRI) */}
                <div
                    className={cn(
                        'md:col-span-4 p-6 sm:p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between min-h-[220px] sm:min-h-[260px] md:min-h-[300px] border-2',
                        {
                            'bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-900 border-lime-400 shadow-2xl shadow-lime-400/20':
                                isTeamAWinner,
                            'bg-zinc-900/90 border-lime-400/90 ring-4 ring-lime-400/20 shadow-2xl shadow-lime-400/10':
                                !isTeamAWinner && isTeamAServing,
                            'bg-zinc-900/70 border-zinc-800/80':
                                !isTeamAWinner && !isTeamAServing,
                        }
                    )}
                >
                    {/* Header Kartu Tim A: Serve / Winner Badge */}
                    <div className="flex items-center justify-between gap-2">
                        <span
                            className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400"
                        >
                            TIM A
                        </span>

                        {isTeamAServing && (
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/30 animate-pulse"
                            >
                                <CircleDot className="w-3.5 h-3.5 fill-current" />
                                SERVE
                            </span>
                        )}

                        {isTeamAWinner && (
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/40"
                            >
                                <Trophy className="w-3.5 h-3.5" />
                                PEMENANG
                            </span>
                        )}
                    </div>

                    {/* Nama Pemain Tim A */}
                    <div className="my-auto py-3 space-y-1">
                        <div
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight line-clamp-1"
                        >
                            {teamAPlayer1}
                        </div>
                        <div
                            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-300 tracking-tight leading-tight line-clamp-1"
                        >
                            {teamAPlayer2}
                        </div>
                    </div>

                    {/* Game Won Tim A */}
                    <div
                        className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-400"
                    >
                        <span>GAME DIMENANGKAN</span>
                        <span className="text-xl font-bold text-white">
                            {match.games_team_a}
                        </span>
                    </div>
                </div>

                {/* KOLOM TENGAH: SKOR POIN RAKSASA & GAME SCORE */}
                <div
                    className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6"
                >
                    {/* SKOR POIN BESAR */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-center gap-3 sm:gap-6">
                            <span
                                className="font-[family-name:var(--font-anton)] text-7xl sm:text-8xl md:text-9xl lg:text-[10vw] font-black text-lime-400 tracking-tight leading-none drop-shadow-[0_0_35px_rgba(163,230,53,0.3)]"
                            >
                                {match.current_point_a || '0'}
                            </span>
                            <span
                                className="font-[family-name:var(--font-anton)] text-4xl sm:text-6xl md:text-7xl text-zinc-600 leading-none pb-2"
                            >
                                :
                            </span>
                            <span
                                className="font-[family-name:var(--font-anton)] text-7xl sm:text-8xl md:text-9xl lg:text-[10vw] font-black text-lime-400 tracking-tight leading-none drop-shadow-[0_0_35px_rgba(163,230,53,0.3)]"
                            >
                                {match.current_point_b || '0'}
                            </span>
                        </div>

                        <div
                            className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-zinc-400"
                        >
                            {isTiebreak ? 'POIN TIEBREAK (RACE TO 7)' : 'SKOR POIN GAME'}
                        </div>
                    </div>

                    {/* REKAP SKOR GAME PERTANDINGAN */}
                    <div
                        className="p-3 sm:p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 w-full max-w-xs shadow-xl backdrop-blur-sm"
                    >
                        <div
                            className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest mb-1"
                        >
                            SKOR GAME
                        </div>
                        <div
                            className="text-3xl sm:text-4xl font-[family-name:var(--font-anton)] text-white tracking-wider flex items-center justify-center gap-3"
                        >
                            <span>{match.games_team_a}</span>
                            <span className="text-zinc-600 text-2xl font-sans">-</span>
                            <span>{match.games_team_b}</span>
                        </div>
                        <div className="text-[10px] font-mono text-lime-400 mt-1">
                            {match.round === 'group'
                                ? 'Target: 3 Game (Best of 5)'
                                : 'Target: 6 Game (First to 6)'}
                        </div>
                    </div>
                </div>

                {/* KOLOM TIM B (KANAN) */}
                <div
                    className={cn(
                        'md:col-span-4 p-6 sm:p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between min-h-[220px] sm:min-h-[260px] md:min-h-[300px] border-2 text-right',
                        {
                            'bg-gradient-to-bl from-emerald-950/80 via-zinc-900 to-zinc-900 border-lime-400 shadow-2xl shadow-lime-400/20':
                                isTeamBWinner,
                            'bg-zinc-900/90 border-lime-400/90 ring-4 ring-lime-400/20 shadow-2xl shadow-lime-400/10':
                                !isTeamBWinner && isTeamBServing,
                            'bg-zinc-900/70 border-zinc-800/80':
                                !isTeamBWinner && !isTeamBServing,
                        }
                    )}
                >
                    {/* Header Kartu Tim B: Serve / Winner Badge */}
                    <div className="flex items-center justify-between flex-row-reverse gap-2">
                        <span
                            className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400"
                        >
                            TIM B
                        </span>

                        {isTeamBServing && (
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/30 animate-pulse"
                            >
                                <CircleDot className="w-3.5 h-3.5 fill-current" />
                                SERVE
                            </span>
                        )}

                        {isTeamBWinner && (
                            <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/40"
                            >
                                <Trophy className="w-3.5 h-3.5" />
                                PEMENANG
                            </span>
                        )}
                    </div>

                    {/* Nama Pemain Tim B */}
                    <div className="my-auto py-3 space-y-1">
                        <div
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight line-clamp-1"
                        >
                            {teamBPlayer1}
                        </div>
                        <div
                            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-300 tracking-tight leading-tight line-clamp-1"
                        >
                            {teamBPlayer2}
                        </div>
                    </div>

                    {/* Game Won Tim B */}
                    <div
                        className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs font-mono text-zinc-400 flex-row-reverse"
                    >
                        <span>GAME DIMENANGKAN</span>
                        <span className="text-xl font-bold text-white">
                            {match.games_team_b}
                        </span>
                    </div>
                </div>
            </div>
        </main>
    )
}
