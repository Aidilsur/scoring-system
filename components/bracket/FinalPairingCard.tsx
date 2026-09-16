import React from 'react'
import { Trophy, Medal, Calendar, MapPin, CheckCircle2, Crown } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import type { SemifinalMatchWithTeams } from '@/hooks/useBracketQuery'

export interface FinalPairingCardProps {
    match: SemifinalMatchWithTeams
    type: 'final' | 'third_place'
}

export function FinalPairingCard({ match, type }: FinalPairingCardProps) {
    const isCompleted = match.status === 'completed'
    const isLive = match.status === 'live'
    const isTeamAWinner = isCompleted && match.winner_team_id === match.team_a_id
    const isTeamBWinner = isCompleted && match.winner_team_id === match.team_b_id

    const teamAName = match.team_a
        ? `${match.team_a.player1_name} / ${match.team_a.player2_name}`
        : 'TBD'
    const teamBName = match.team_b
        ? `${match.team_b.player1_name} / ${match.team_b.player2_name}`
        : 'TBD'

    const isFinal = type === 'final'

    return (
        <Card
            className={`p-5 sm:p-6 transition-all shadow-xl border ${
                isFinal
                    ? 'bg-gradient-to-b from-amber-950/20 via-zinc-900/90 to-zinc-900/90 border-amber-500/40 hover:border-amber-500/60'
                    : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700/80'
            }`}
        >
            {/* Header: Stage Badge & Status */}
            <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                    {isFinal ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400/15 border border-amber-400/40 text-amber-300">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            FINAL — JUARA 1 &amp; 2
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-zinc-300">
                            <Medal className="w-3.5 h-3.5 text-amber-400" />
                            PEREBUTAN JUARA 3
                        </span>
                    )}
                </div>

                <div>
                    {isLive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            LIVE
                        </span>
                    )}
                    {isCompleted && (
                        <Badge variant="success" size="sm" className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            SELESAI
                        </Badge>
                    )}
                    {!isLive && !isCompleted && (
                        <Badge variant="neutral" size="sm">
                            TERJADWAL
                        </Badge>
                    )}
                </div>
            </div>

            {/* Match Teams Box */}
            <div className="space-y-3">
                {/* Team A */}
                <div
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isTeamAWinner
                            ? isFinal
                                ? 'bg-amber-950/40 border-amber-500/50 text-white shadow-md shadow-amber-500/10'
                                : 'bg-lime-950/30 border-lime-500/40 text-white'
                            : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                isTeamAWinner
                                    ? isFinal
                                        ? 'bg-amber-400 text-zinc-950'
                                        : 'bg-lime-400 text-zinc-950'
                                    : 'bg-zinc-800 text-zinc-400'
                            }`}
                        >
                            A
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-sm truncate flex items-center gap-2">
                                <span className="truncate">{teamAName}</span>
                                {isTeamAWinner && (
                                    <Trophy
                                        className={`w-4 h-4 shrink-0 ${
                                            isFinal ? 'text-amber-400' : 'text-lime-400'
                                        }`}
                                    />
                                )}
                            </div>
                            {isTeamAWinner && isFinal && (
                                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                                    🏆 Juara 1
                                </span>
                            )}
                        </div>
                    </div>

                    {(isLive || isCompleted) && (
                        <div
                            className={`font-mono font-bold text-lg px-2 ${
                                isFinal ? 'text-amber-400' : 'text-lime-400'
                            }`}
                        >
                            {match.games_team_a}
                        </div>
                    )}
                </div>

                {/* VS Divider */}
                <div className="flex items-center justify-center -my-1">
                    <span className="text-[10px] font-black tracking-widest text-zinc-600 uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        VS
                    </span>
                </div>

                {/* Team B */}
                <div
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isTeamBWinner
                            ? isFinal
                                ? 'bg-amber-950/40 border-amber-500/50 text-white shadow-md shadow-amber-500/10'
                                : 'bg-lime-950/30 border-lime-500/40 text-white'
                            : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-200'
                    }`}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                isTeamBWinner
                                    ? isFinal
                                        ? 'bg-amber-400 text-zinc-950'
                                        : 'bg-lime-400 text-zinc-950'
                                    : 'bg-zinc-800 text-zinc-400'
                            }`}
                        >
                            B
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-sm truncate flex items-center gap-2">
                                <span className="truncate">{teamBName}</span>
                                {isTeamBWinner && (
                                    <Trophy
                                        className={`w-4 h-4 shrink-0 ${
                                            isFinal ? 'text-amber-400' : 'text-lime-400'
                                        }`}
                                    />
                                )}
                            </div>
                            {isTeamBWinner && isFinal && (
                                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                                    🏆 Juara 1
                                </span>
                            )}
                        </div>
                    </div>

                    {(isLive || isCompleted) && (
                        <div
                            className={`font-mono font-bold text-lg px-2 ${
                                isFinal ? 'text-amber-400' : 'text-lime-400'
                            }`}
                        >
                            {match.games_team_b}
                        </div>
                    )}
                </div>
            </div>

            {/* Match Schedule / Court Meta */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{match.court?.name || 'Belum ada court'}</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>
                        {match.scheduled_time
                            ? match.scheduled_time.slice(0, 5)
                            : 'Belum dijadwalkan'}
                    </span>
                </div>
            </div>
        </Card>
    )
}
