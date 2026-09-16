'use client'

import React from 'react'
import { Trophy, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Group, GroupStandingItem } from '@/types/domain'

export interface GroupStandingsTableProps {
    group: Group
    standings: GroupStandingItem[]
    hasTieRequiringManualDecision?: boolean
}

function formatGameDiff(diff: number): string {
    if (diff > 0) return `+${diff}`
    return diff.toString()
}

/**
 * GroupStandingsTable
 * Komponen tabel klasemen untuk 1 grup, dioptimalkan untuk TV display (16:9).
 * Format kolom: T - M - K - S - P
 * Highlight:
 * - Peringkat 1: border-l-4 border-lime-400 bg-lime-400/10 text-white (Juara Grup)
 * - Peringkat 2: border-l-4 border-emerald-400 bg-emerald-400/10 (Runner-up)
 */
export function GroupStandingsTable({
    group,
    standings,
    hasTieRequiringManualDecision = false,
}: GroupStandingsTableProps) {
    return (
        <div className="flex flex-col h-full rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-xl shadow-black/40">
            {/* Header Grup */}
            <div className="flex items-center justify-between px-5 py-4 bg-zinc-900 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
                    <h3 className="font-[family-name:var(--font-anton)] text-xl sm:text-2xl text-white uppercase tracking-wider">
                        {group.name}
                    </h3>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                    <span>{standings.length} TIM</span>
                    <span>•</span>
                    <span className="text-lime-400 font-semibold">TOP 2 LOLOS SEMIFINAL</span>
                </div>
            </div>

            {/* Alert jika ada tie krusial yang butuh keputusan manual */}
            {hasTieRequiringManualDecision && (
                <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-amber-200 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                        Poin, head-to-head, dan selisih game seimbang pada posisi kelolosan. Menunggu keputusan panitia.
                    </span>
                </div>
            )}

            {/* Tabel Klasemen */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[520px]">
                    <thead>
                        <tr className="border-b border-zinc-800/80 text-[11px] font-mono uppercase tracking-wider text-zinc-400 bg-zinc-950/40">
                            <th className="py-3 px-4 w-12 text-center">POS</th>
                            <th className="py-3 px-4">TIM / PEMAIN</th>
                            <th className="py-3 px-3 text-center w-12" title="Total Main">T</th>
                            <th className="py-3 px-3 text-center w-12" title="Menang">M</th>
                            <th className="py-3 px-3 text-center w-12" title="Kalah">K</th>
                            <th className="py-3 px-3 text-center w-16" title="Selisih Game">S</th>
                            <th className="py-3 px-4 text-center w-16 text-lime-400 font-bold" title="Poin">P</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50 text-sm">
                        {standings.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-xs font-mono text-zinc-400">
                                    Belum ada tim yang terdaftar di grup ini.
                                </td>
                            </tr>
                        ) : (
                            standings.map((item) => {
                                const isRank1 = item.rank === 1
                                const isRank2 = item.rank === 2
                                const player1 = item.team?.player1_name || 'Player 1'
                                const player2 = item.team?.player2_name || 'Player 2'

                                // Styling baris sesuai docs/design-theme.md:
                                // Rank 1: border-l-4 border-lime-400 bg-lime-400/10 text-white
                                // Rank 2: border-l-4 border-emerald-400 bg-emerald-400/10
                                // Rank 3+: border-l-4 border-transparent text-zinc-300
                                let rowStyle = 'border-l-4 border-transparent text-zinc-300 hover:bg-zinc-800/30'
                                if (isRank1) {
                                    rowStyle = 'border-l-4 border-lime-400 bg-lime-400/10 text-white font-medium'
                                } else if (isRank2) {
                                    rowStyle = 'border-l-4 border-emerald-400 bg-emerald-400/10 text-zinc-100 font-medium'
                                }

                                return (
                                    <tr
                                        key={item.team_id}
                                        className={`transition-colors ${rowStyle}`}
                                    >
                                        {/* Rank Position */}
                                        <td className="py-3.5 px-4 text-center">
                                            <span
                                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold ${
                                                    isRank1
                                                        ? 'bg-lime-400 text-zinc-950 font-black shadow-sm shadow-lime-400/20'
                                                        : isRank2
                                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                        : 'text-zinc-400'
                                                }`}
                                            >
                                                {item.rank}
                                            </span>
                                        </td>

                                        {/* Tim / Pemain */}
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-0.5">
                                                <div className="font-semibold text-sm sm:text-base leading-tight flex items-center gap-2">
                                                    <span>{player1} / {player2}</span>
                                                    {isRank1 && (
                                                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-300 border border-lime-400/30">
                                                            <Trophy className="w-2.5 h-2.5" />
                                                            Juara Grup
                                                        </span>
                                                    )}
                                                    {isRank2 && (
                                                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                                            Runner-up
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                                                    <span>GF: {item.games_for}</span>
                                                    <span>•</span>
                                                    <span>GA: {item.games_against}</span>
                                                    {item.needsManualDecision && (
                                                        <span className="text-amber-400 font-bold">
                                                            (Perlu Keputusan)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* T: Total Main */}
                                        <td className="py-3.5 px-3 text-center font-mono text-sm text-zinc-300">
                                            {item.played}
                                        </td>

                                        {/* M: Menang */}
                                        <td className="py-3.5 px-3 text-center font-mono text-sm font-semibold text-zinc-200">
                                            {item.won}
                                        </td>

                                        {/* K: Kalah */}
                                        <td className="py-3.5 px-3 text-center font-mono text-sm text-zinc-400">
                                            {item.lost}
                                        </td>

                                        {/* S: Selisih Game */}
                                        <td
                                            className={`py-3.5 px-3 text-center font-mono text-sm font-semibold ${
                                                item.game_diff > 0
                                                    ? 'text-lime-400'
                                                    : item.game_diff < 0
                                                    ? 'text-rose-400'
                                                    : 'text-zinc-400'
                                            }`}
                                        >
                                            {formatGameDiff(item.game_diff)}
                                        </td>

                                        {/* P: Poin */}
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="font-[family-name:var(--font-anton)] text-xl sm:text-2xl text-lime-400">
                                                {item.points}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Legend */}
            <div className="px-5 py-3 bg-zinc-950/70 border-t border-zinc-800 text-[11px] font-mono text-zinc-400 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-lime-400" />
                        <span className="text-zinc-300">Juara Grup (Lolos Semifinal)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                        <span className="text-zinc-300">Runner-up (Lolos Semifinal)</span>
                    </div>
                </div>

                <div>
                    <span>Menang: 3 Poin • Kalah: 0 Poin</span>
                </div>
            </div>
        </div>
    )
}
