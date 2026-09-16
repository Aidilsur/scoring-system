'use client'

import React from 'react'
import Link from 'next/link'
import {
    Trophy,
    Users,
    Layers,
    ChevronRight,
    CheckCircle2,
    Activity,
    Calendar,
    Crown,
} from 'lucide-react'
import { Badge } from '@/components/ui'
import type { CategoryStandingsOverviewItem } from '@/hooks/useStandingsOverviewQuery'

export interface StandingsOverviewCardProps {
    item: CategoryStandingsOverviewItem
}

export function StandingsOverviewCard({ item }: StandingsOverviewCardProps) {
    const {
        category,
        groupCount,
        teamCount,
        totalGroupMatches,
        completedGroupMatches,
        isGroupStageComplete,
        groupLeaders,
    } = item

    return (
        <Link
            href={`/display/standings/${category.id}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-lime-500/60 p-5 sm:p-6 transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl hover:shadow-lime-950/40"
        >
            {/* Ambient subtle glow saat hover */}
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-lime-400/5 rounded-full blur-3xl pointer-events-none group-hover:bg-lime-400/15 transition-all duration-500" />

            <div className="space-y-5">
                {/* 1. Header Card: Kategori & Badges */}
                <div className="flex flex-col gap-2.5 pb-4 border-b border-zinc-800/80">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-lime-400/10 text-lime-400 border border-lime-400/20">
                                {category.partner_type?.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {category.level?.toUpperCase()}
                            </span>
                        </div>

                        <div>
                            {isGroupStageComplete ? (
                                <Badge variant="success" size="sm" className="flex items-center gap-1 text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 text-lime-400" />
                                    GRUP TUNTAS
                                </Badge>
                            ) : completedGroupMatches > 0 ? (
                                <Badge variant="warning" size="sm" className="flex items-center gap-1 text-[10px]">
                                    <Activity className="w-3 h-3 text-amber-400" />
                                    {completedGroupMatches}/{totalGroupMatches} SELESAI
                                </Badge>
                            ) : (
                                <Badge variant="neutral" size="sm" className="text-[10px]">
                                    {totalGroupMatches} MATCH
                                </Badge>
                            )}
                        </div>
                    </div>

                    <h2 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-white uppercase tracking-tight group-hover:text-lime-400 transition-colors">
                        {category.name}
                    </h2>

                    {/* Quick Stats bar: Groups & Teams */}
                    <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                        <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-lime-400" />
                            <span>{groupCount} Grup</span>
                        </div>
                        <span className="text-zinc-700">•</span>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{teamCount} Tim Terdaftar</span>
                        </div>
                    </div>
                </div>

                {/* 2. Preview Pemimpin Grup Sementara */}
                <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        <span className="flex items-center gap-1.5 text-zinc-300">
                            <Crown className="w-3.5 h-3.5 text-lime-400" />
                            Peringkat 1 Sementara
                        </span>
                        <span className="text-zinc-500">Poin</span>
                    </div>

                    {groupLeaders.length === 0 ? (
                        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-500">
                            Belum ada pembagian grup
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {groupLeaders.map((gl) => {
                                const teamLabel = gl.team
                                    ? `${gl.team.player1_name} / ${gl.team.player2_name}`
                                    : 'Menunggu pertandingan'

                                return (
                                    <div
                                        key={gl.groupId}
                                        className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 group-hover:border-zinc-700/80 transition-all"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider bg-zinc-800 text-lime-400 border border-zinc-700/80">
                                                {gl.groupName}
                                            </span>

                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                                                    <span className="truncate">{teamLabel}</span>
                                                    {gl.hasMatches && (
                                                        <Trophy className="w-3 h-3 text-lime-400 shrink-0" />
                                                    )}
                                                </div>
                                                {gl.hasMatches && (
                                                    <div className="text-[10px] font-mono text-zinc-500">
                                                        {gl.won}M - {gl.lost}K ({gl.played} main)
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="font-mono font-bold text-sm text-lime-400">
                                                {gl.hasMatches ? `${gl.points} P` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Footer: Direct Navigation Action */}
            <div className="mt-5 pt-3.5 border-t border-zinc-800/60 flex items-center justify-between text-xs font-bold text-zinc-400 group-hover:text-lime-400 transition-colors">
                <span className="tracking-wide">Buka Klasemen Lengkap</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
        </Link>
    )
}
