'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Radio,
    Clock,
    ArrowLeft,
    Layers,
    AlertCircle,
    RefreshCw,
    Users,
    Table,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { PadelCourtGeometry } from './PadelCourtGeometry'
import { GroupStandingsTable } from './GroupStandingsTable'
import { useCategoryStandingsQuery } from '@/hooks/useCategoryStandingsQuery'
import { useRealtimeMatch } from '@/hooks/useRealtimeMatch'

interface CategoryStandingsViewProps {
    categoryId: string
}

/**
 * CategoryStandingsView
 * Tampilan layar penuh (TV Display / Fullscreen) klasemen seluruh grup dalam 1 kategori.
 * Publik, tanpa login, subscribe ke Supabase Realtime tabel matches untuk auto-update.
 */
export function CategoryStandingsView({ categoryId }: CategoryStandingsViewProps) {
    const { data, isLoading, error, refetch } = useCategoryStandingsQuery(categoryId)

    useRealtimeMatch({
        categoryId,
    })

    const [currentTime, setCurrentTime] = useState<string>('')

    useEffect(() => {
        function updateClock() {
            const now = new Date()
            const timeStr = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            })
            setCurrentTime(`${timeStr} WIB`)
        }

        updateClock()
        const timer = setInterval(updateClock, 1000)
        return () => clearInterval(timer)
    }, [])

    const category = data?.category
    const groups = data?.groups || []
    const totalTeams = data?.totalTeams || 0
    const totalGroups = data?.totalGroups || 0

    return (
        <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden select-none">
            {/* Latar Belakang Garis Geometris Lapangan Padel */}
            <PadelCourtGeometry />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Header Broadcast Bar */}
                <header
                    className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800/80"
                >
                    <div className="space-y-2">
                        <div
                            className="flex items-center gap-2 text-xs font-mono tracking-widest text-lime-400 uppercase font-semibold"
                        >
                            <Link
                                href="/display/courts"
                                className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Multi-Court</span>
                            </Link>
                            <span className="text-zinc-600">/</span>
                            <span>Display System</span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-white">Standings</span>
                        </div>

                        <div className="space-y-1">
                            <h1
                                className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight flex items-center gap-3"
                            >
                                <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-lime-400 animate-pulse" />
                                <span>{category?.name || 'Klasemen Turnamen'}</span>
                            </h1>

                            <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                                Klasemen Fase Grup • Format Round Robin • Top 2 Melaju ke Babak Semifinal
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats & Live Indicator */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        {/* Digital Clock */}
                        <div
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono font-bold text-zinc-200"
                        >
                            <Clock className="w-4 h-4 text-lime-400" />
                            <span>{currentTime || '00:00:00 WIB'}</span>
                        </div>

                        {/* Status Realtime Connected */}
                        <div
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-xs font-mono font-bold text-lime-400"
                        >
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping mr-0.5" />
                            <span>REALTIME SYNC</span>
                        </div>

                        {/* Statistik Kategori */}
                        {category && (
                            <div
                                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-400"
                            >
                                <Users className="w-3.5 h-3.5 text-lime-400" />
                                <span><strong className="text-white">{totalTeams}</strong> Tim</span>
                                <span>•</span>
                                <span><strong className="text-white">{totalGroups}</strong> Grup</span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Loading State */}
                {isLoading && (
                    <div className="py-24 text-center space-y-4">
                        <div
                            className="w-12 h-12 border-3 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto"
                        />
                        <p className="text-sm font-mono text-zinc-400">
                            Memuat data klasemen grup langsung dari server...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div
                        className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-zinc-900 border border-rose-500/30 text-center space-y-4"
                    >
                        <div
                            className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto"
                        >
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-white">Gagal Memuat Klasemen</h3>
                        <p className="text-xs text-zinc-400">
                            {error instanceof Error ? error.message : 'Terjadi kendala saat mengambil data klasemen.'}
                        </p>
                        <Button
                            onClick={() => refetch()}
                            variant="outline"
                            size="sm"
                            className="inline-flex items-center gap-2"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Coba Lagi
                        </Button>
                    </div>
                )}

                {/* Empty State: Belum ada Grup */}
                {!isLoading && !error && groups.length === 0 && (
                    <div
                        className="max-w-lg mx-auto my-16 p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-4"
                    >
                        <div
                            className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto"
                        >
                            <Table className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Belum Ada Grup Dibuat</h3>
                        <p className="text-xs text-zinc-400">
                            Drawing grup untuk kategori ini belum dilakukan oleh panitia turnamen. Klasemen akan otomatis muncul setelah drawing grup selesai di-generate.
                        </p>
                    </div>
                )}

                {/* Grid Tabel Klasemen Grup (1 kolom jika 1 grup, 2 kolom side-by-side jika multi-grup) */}
                {!isLoading && !error && groups.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400">
                                <Layers className="w-4 h-4 text-lime-400" />
                                <span>TABEL KLASEMEN FASE GRUP ({totalGroups} GRUP)</span>
                            </div>

                            <div className="text-xs font-mono text-zinc-400">
                                Otomatis update setelah setiap match selesai
                            </div>
                        </div>

                        <div
                            className={cn(
                                'grid gap-6 sm:gap-8',
                                groups.length === 1
                                    ? 'grid-cols-1 max-w-4xl mx-auto'
                                    : 'grid-cols-1 lg:grid-cols-2'
                            )}
                        >
                            {groups.map((groupWithStandings) => (
                                <GroupStandingsTable
                                    key={groupWithStandings.group.id}
                                    group={groupWithStandings.group}
                                    standings={groupWithStandings.standings}
                                    hasTieRequiringManualDecision={
                                        groupWithStandings.hasTieRequiringManualDecision
                                    }
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer Navigasi */}
                <footer
                    className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400"
                >
                    <div className="flex items-center gap-4">
                        <span className="text-zinc-300 font-semibold">Padel Scoring System</span>
                        <span>•</span>
                        <span>Official Standings Engine</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/display/courts"
                            className="hover:text-lime-400 transition-colors"
                        >
                            Multi-Court Monitor
                        </Link>
                        <span>•</span>
                        <Link
                            href="/admin/scoring"
                            className="hover:text-lime-400 transition-colors"
                        >
                            Portal Wasit (Admin)
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    )
}
