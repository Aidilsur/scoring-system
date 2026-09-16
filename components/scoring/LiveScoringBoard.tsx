'use client'

import React from 'react'
import {
    ArrowLeft,
    RotateCcw,
    Plus,
    CircleDot,
    Trophy,
    Flame,
    Lock,
    Unlock,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import { shouldStartTiebreakGame, ROUND_LABELS, type MatchTeam } from '@/lib/scoring'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/domain'

interface LiveScoringBoardProps {
    match: Match
    servingTeam: MatchTeam
    canUndo: boolean
    historyCount: number
    isPending: boolean
    pendingTeam?: MatchTeam | null
    isReadOnly?: boolean
    isReleasing?: boolean
    onRecordPoint: (team: MatchTeam) => void
    onUndoPoint: () => void
    onToggleServe: (team?: MatchTeam) => void
    onBack: () => void
    onReleaseControl?: () => void
}

/**
 * LiveScoringBoard: Tampilan antarmuka utama pencatatan skor live oleh wasit.
 * Tipografi masif skor poin (Anton Font), tombol besar "+1", dan tombol undo.
 */
export function LiveScoringBoard({
    match,
    servingTeam,
    canUndo,
    historyCount,
    isPending,
    pendingTeam,
    isReadOnly = false,
    isReleasing = false,
    onRecordPoint,
    onUndoPoint,
    onToggleServe,
    onBack,
    onReleaseControl,
}: LiveScoringBoardProps) {
    const isCompleted = match.status === 'completed'
    const isTiebreak = shouldStartTiebreakGame(
        match.games_team_a,
        match.games_team_b,
        match.round
    )

    const isGroupTiebreak = isTiebreak && match.round === 'group'

    const teamAName = `${match.team_a?.player1_name || 'Pemain 1'} / ${match.team_a?.player2_name || 'Pemain 2'}`
    const teamBName = `${match.team_b?.player1_name || 'Pemain 1'} / ${match.team_b?.player2_name || 'Pemain 2'}`

    const winnerName = match.winner_team_id === match.team_a_id ? teamAName : teamBName

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Top Navigation & Status Bar */}
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-zinc-800">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Daftar Pertandingan</span>
                </button>

                <div className="flex items-center gap-2">
                    {match.court?.name && (
                        <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                            {match.court.name}
                        </span>
                    )}

                    {!isReadOnly && !isCompleted && onReleaseControl && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onReleaseControl}
                            disabled={isPending || isReleasing}
                            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 text-xs font-bold py-1 px-2.5 h-auto transition-all"
                            title="Lepas kendali scoring agar dapat diambil alih akun wasit lain"
                        >
                            <Unlock className="w-3.5 h-3.5 mr-1 text-amber-400" />
                            {isReleasing ? 'Melepas...' : 'Lepas Kendali'}
                        </Button>
                    )}

                    {isCompleted ? (
                        <Badge variant="success" size="sm">
                            <Trophy className="w-3 h-3 mr-1" />
                            PERTANDINGAN SELESAI
                        </Badge>
                    ) : (
                        <Badge variant="warning" size="sm">
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse mr-1" />
                            LIVE SCORING
                        </Badge>
                    )}
                </div>
            </div>

            {/* Banner Mode Read-Only / Sesi Diklaim Akun Lain */}
            {isReadOnly && (
                <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-between gap-3 text-amber-200">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                            <span className="font-bold text-sm tracking-wide text-amber-300">
                                Match ini sedang di-score oleh akun wasit lain
                            </span>
                            <p className="text-xs text-zinc-300">
                                Mode Read-Only aktif. Skor tetap diperbarui secara live via Realtime, namun tombol poin dan undo dinonaktifkan.
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-mono font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-lg">
                        READ-ONLY
                    </span>
                </div>
            )}

            {/* Banner Mode Tiebreak / Golden Game jika aktif */}
            {isTiebreak && !isCompleted && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200 animate-pulse">
                    <div className="flex items-center gap-2.5">
                        <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                            <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                                {isGroupTiebreak ? 'TIEBREAK FASE GRUP (SKOR 2-2)' : 'GOLDEN GAME KNOCKOUT (SKOR 5-5)'}
                            </span>
                            <p className="text-[11px] text-zinc-300">
                                {isGroupTiebreak
                                    ? 'Format Race to 7 Poin dengan syarat wajib selisih 2 poin.'
                                    : 'Format Race to 7 Poin. Tim pertama mencapai 7 poin langsung menang!'}
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-mono font-black bg-amber-400 text-zinc-950 px-2 py-0.5 rounded">
                        RACE TO 7
                    </span>
                </div>
            )}

            {/* Header Kategori & Babak */}
            <div className="text-center space-y-1">
                <div className="text-xs font-mono uppercase tracking-widest text-lime-400">
                    {match.category?.name} • {ROUND_LABELS[match.round] || match.round}
                </div>
                {match.group?.name && (
                    <div className="text-xs text-zinc-400">
                        {match.group.name}
                    </div>
                )}
            </div>

            {/* SELESAI BANNER */}
            {isCompleted && (
                <div className="p-6 rounded-2xl bg-[#042115] border-2 border-lime-500/80 text-center space-y-2 shadow-2xl shadow-lime-500/10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-lime-400 text-zinc-950 mx-auto">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">
                        Pemenang: {winnerName}
                    </h3>
                    <p className="text-sm font-mono text-lime-400">
                        Skor Akhir Game: {match.games_team_a} - {match.games_team_b}
                    </p>
                    <p className="text-xs text-zinc-400 pt-1">
                        Skor telah otomatis tersimpan. Anda dapat menekan &quot;Undo Poin Terakhir&quot; di bawah jika terjadi salah input pada poin penentu.
                    </p>
                </div>
            )}

            {/* PAPAN SKOR UTAMA (Dua Kolom Tim) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {/* KOLOM TIM A */}
                <div
                    className={cn(
                        'p-4 sm:p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-between',
                        servingTeam === 'team_a'
                            ? 'bg-zinc-900 border-lime-400/80 shadow-lg shadow-lime-400/5'
                            : 'bg-zinc-900/70 border-zinc-800'
                    )}
                >
                    {/* Header Tim A & Serve Toggle */}
                    <div className="w-full text-center space-y-2">
                        <div className="flex items-center justify-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => onToggleServe('team_a')}
                                disabled={isReadOnly || isCompleted}
                                title="Klik untuk pindah giliran serve ke Tim A"
                                className={cn(
                                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 transition-all',
                                    servingTeam === 'team_a'
                                        ? 'bg-lime-400 text-zinc-950 shadow-sm'
                                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200',
                                    (isReadOnly || isCompleted) && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <CircleDot className="w-3 h-3 fill-current" />
                                {servingTeam === 'team_a' ? 'SERVE' : 'Ganti Serve'}
                            </button>
                        </div>

                        <div
                            className="text-sm sm:text-base font-bold text-white leading-snug px-1 min-h-[2.5rem] flex items-center justify-center"
                        >
                            {teamAName}
                        </div>
                    </div>

                    {/* POIN BESAR TIM A */}
                    <div className="my-6 sm:my-8 text-center">
                        <div
                            className="font-[family-name:var(--font-anton)] text-7xl sm:text-8xl md:text-9xl text-lime-400 font-bold tracking-tight leading-none"
                        >
                            {match.current_point_a || '0'}
                        </div>
                        <div className="text-xs sm:text-sm font-mono text-zinc-400 mt-2">
                            Games Menang:{' '}
                            <span className="text-white font-bold text-base">
                                {match.games_team_a}
                            </span>
                        </div>
                    </div>

                    {/* TOMBOL +1 TIM A */}
                    <div className="w-full">
                        <Button
                            onClick={() => onRecordPoint('team_a')}
                            disabled={isCompleted || isReadOnly || isPending}
                            variant="primary"
                            size="lg"
                            className="w-full py-5 text-xl sm:text-2xl font-black rounded-2xl shadow-xl shadow-lime-400/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            {isPending && pendingTeam === 'team_a' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span
                                        className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"
                                    />
                                    <span>Mencatat...</span>
                                </span>
                            ) : (
                                <>
                                    <Plus className="w-6 h-6 stroke-[3]" />
                                    <span>POIN TIM A</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* KOLOM TIM B */}
                <div
                    className={cn(
                        'p-4 sm:p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-between',
                        servingTeam === 'team_b'
                            ? 'bg-zinc-900 border-lime-400/80 shadow-lg shadow-lime-400/5'
                            : 'bg-zinc-900/70 border-zinc-800'
                    )}
                >
                    {/* Header Tim B & Serve Toggle */}
                    <div className="w-full text-center space-y-2">
                        <div className="flex items-center justify-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => onToggleServe('team_b')}
                                disabled={isReadOnly || isCompleted}
                                title="Klik untuk pindah giliran serve ke Tim B"
                                className={cn(
                                    'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 transition-all',
                                    servingTeam === 'team_b'
                                        ? 'bg-lime-400 text-zinc-950 shadow-sm'
                                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200',
                                    (isReadOnly || isCompleted) && 'opacity-50 cursor-not-allowed'
                                )}
                            >
                                <CircleDot className="w-3 h-3 fill-current" />
                                {servingTeam === 'team_b' ? 'SERVE' : 'Ganti Serve'}
                            </button>
                        </div>

                        <div
                            className="text-sm sm:text-base font-bold text-white leading-snug px-1 min-h-[2.5rem] flex items-center justify-center"
                        >
                            {teamBName}
                        </div>
                    </div>

                    {/* POIN BESAR TIM B */}
                    <div className="my-6 sm:my-8 text-center">
                        <div
                            className="font-[family-name:var(--font-anton)] text-7xl sm:text-8xl md:text-9xl text-lime-400 font-bold tracking-tight leading-none"
                        >
                            {match.current_point_b || '0'}
                        </div>
                        <div className="text-xs sm:text-sm font-mono text-zinc-400 mt-2">
                            Games Menang:{' '}
                            <span className="text-white font-bold text-base">
                                {match.games_team_b}
                            </span>
                        </div>
                    </div>

                    {/* TOMBOL +1 TIM B */}
                    <div className="w-full">
                        <Button
                            onClick={() => onRecordPoint('team_b')}
                            disabled={isCompleted || isReadOnly || isPending}
                            variant="primary"
                            size="lg"
                            className="w-full py-5 text-xl sm:text-2xl font-black rounded-2xl shadow-xl shadow-lime-400/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                        >
                            {isPending && pendingTeam === 'team_b' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span
                                        className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"
                                    />
                                    <span>Mencatat...</span>
                                </span>
                            ) : (
                                <>
                                    <Plus className="w-6 h-6 stroke-[3]" />
                                    <span>POIN TIM B</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* REKAP SKOR GAME PERTANDINGAN */}
            <div
                className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-around text-center"
            >
                <div>
                    <div className="text-[11px] font-mono text-zinc-400 uppercase">Game Tim A</div>
                    <div className="text-2xl font-mono font-bold text-white">{match.games_team_a}</div>
                </div>
                <div className="text-zinc-600 font-mono text-xl">-</div>
                <div>
                    <div className="text-[11px] font-mono text-zinc-400 uppercase">Game Tim B</div>
                    <div className="text-2xl font-mono font-bold text-white">{match.games_team_b}</div>
                </div>
                <div className="border-l border-zinc-800 pl-4">
                    <div className="text-[11px] font-mono text-zinc-400 uppercase">Target Menang</div>
                    <div className="text-xs font-mono font-bold text-lime-400">
                        {match.round === 'group' ? '3 Game (Best of 5)' : '6 Game (First to 6)'}
                    </div>
                </div>
            </div>

            {/* TOMBOL UNDO POIN TERAKHIR */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                    onClick={onUndoPoint}
                    disabled={!canUndo || isPending || isReadOnly}
                    variant="outline"
                    size="md"
                    className={cn(
                        'w-full sm:w-auto text-rose-300 border-rose-900/60 hover:bg-rose-950/40 hover:border-rose-700',
                        'disabled:opacity-40 disabled:border-zinc-800 disabled:text-zinc-600',
                        'inline-flex items-center justify-center gap-2 rounded-xl'
                    )}
                >
                    <RotateCcw className="w-4 h-4" />
                    <span>Undo Poin Terakhir</span>
                    {historyCount > 0 && (
                        <span
                            className="ml-1 px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-950/80 border border-rose-800 text-rose-300"
                        >
                            {historyCount} snapshot
                        </span>
                    )}
                </Button>

                <div className="text-xs text-zinc-500">
                    Realtime sync aktif • Snapshot tersimpan di database
                </div>
            </div>
        </div>
    )
}
