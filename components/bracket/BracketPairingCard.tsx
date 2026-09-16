import React from 'react'
import { Trophy, Calendar, MapPin, CheckCircle2 } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import type { SemifinalMatchWithTeams } from '@/hooks/useBracketQuery'
import { cn } from '@/lib/utils'

interface BracketPairingCardProps {
    match: SemifinalMatchWithTeams
    matchIndex: number
}

export function BracketPairingCard({ match, matchIndex }: BracketPairingCardProps) {
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

    return (
        <Card
            className="p-5 sm:p-6 bg-zinc-900/90 border-zinc-800 hover:border-zinc-700/80 transition-all shadow-xl"
        >
            {/* Header: Semifinal Badge & Status */}
            <div
                className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-800/80"
            >
                <div className="flex items-center gap-2">
                    <Badge variant="success" size="md" className="tracking-wider">
                        Semifinal {matchIndex + 1}
                    </Badge>
                </div>

                <div>
                    {isLive && (
                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                        >
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
                    className={cn(
                        'flex items-center justify-between p-3.5 rounded-xl border transition-all',
                        isTeamAWinner
                            ? 'bg-lime-950/30 border-lime-500/40 text-white'
                            : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-200'
                    )}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center',
                                'font-black text-xs shrink-0',
                                isTeamAWinner
                                    ? 'bg-lime-400 text-zinc-950'
                                    : 'bg-zinc-800 text-zinc-400'
                            )}
                        >
                            A
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-sm truncate flex items-center gap-2">
                                <span className="truncate">{teamAName}</span>
                                {isTeamAWinner && (
                                    <Trophy className="w-4 h-4 text-lime-400 shrink-0" />
                                )}
                            </div>
                        </div>
                    </div>

                    {(isLive || isCompleted) && (
                        <div className="font-mono font-bold text-lg px-2 text-lime-400">
                            {match.games_team_a}
                        </div>
                    )}
                </div>

                {/* VS Divider */}
                <div className="flex items-center justify-center -my-1">
                    <span
                        className="text-[10px] font-black tracking-widest text-zinc-600 uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800"
                    >
                        VS
                    </span>
                </div>

                {/* Team B */}
                <div
                    className={cn(
                        'flex items-center justify-between p-3.5 rounded-xl border transition-all',
                        isTeamBWinner
                            ? 'bg-lime-950/30 border-lime-500/40 text-white'
                            : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-200'
                    )}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center',
                                'font-black text-xs shrink-0',
                                isTeamBWinner
                                    ? 'bg-lime-400 text-zinc-950'
                                    : 'bg-zinc-800 text-zinc-400'
                            )}
                        >
                            B
                        </div>
                        <div className="min-w-0">
                            <div className="font-semibold text-sm truncate flex items-center gap-2">
                                <span className="truncate">{teamBName}</span>
                                {isTeamBWinner && (
                                    <Trophy className="w-4 h-4 text-lime-400 shrink-0" />
                                )}
                            </div>
                        </div>
                    </div>

                    {(isLive || isCompleted) && (
                        <div className="font-mono font-bold text-lg px-2 text-lime-400">
                            {match.games_team_b}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Schedule info */}
            <div
                className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2"
            >
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{match.court?.name || 'Court belum ditentukan'}</span>
                </div>

                {match.scheduled_time && (
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                        <span>
                            {new Date(match.scheduled_time).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    )
}
