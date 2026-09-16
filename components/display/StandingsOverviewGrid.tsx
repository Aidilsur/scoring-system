'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Trophy,
    Clock,
    RotateCw,
    Layers,
    Users,
    ArrowLeft,
    AlertCircle,
    Activity,
    Shield,
} from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { PadelCourtGeometry } from './PadelCourtGeometry'
import { StandingsOverviewCard } from './StandingsOverviewCard'
import { useStandingsOverviewQuery } from '@/hooks/useStandingsOverviewQuery'
import { useRealtimeMatch } from '@/hooks/useRealtimeMatch'

export function StandingsOverviewGrid() {
    // 1. Data Query Standings Overview
    const { data, isLoading, error, refetch, isRefetching } = useStandingsOverviewQuery()

    // 2. Realtime Subscription untuk semua perubahan pada tabel matches
    useRealtimeMatch({
        allMatches: true,
    })

    // 3. Jam Digital Broadcast Realtime (HH:mm:ss WIB)
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

    const categories = data?.categories || []
    const totalCategories = data?.totalCategories || 0
    const totalGroups = data?.totalGroups || 0
    const totalTeams = data?.totalTeams || 0
    const totalMatches = data?.totalMatches || 0
    const totalCompletedMatches = data?.totalCompletedMatches || 0

    return (
        <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden select-none">
            {/* Latar Belakang Garis Geometris Lapangan Padel */}
            <PadelCourtGeometry />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {/* Top Header Broadcast Bar */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800/80">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-lime-400 uppercase font-semibold">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Home</span>
                            </Link>
                            <span className="text-zinc-600">/</span>
                            <span>Display System</span>
                            <span className="text-zinc-600">/</span>
                            <span className="text-white">Standings Hub</span>
                        </div>

                        <h1 className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight flex items-center gap-3">
                            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-lime-400" />
                            Klasemen Turnamen
                        </h1>

                        <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                            Pusat pemantauan klasemen babak penyisihan grup seluruh kategori turnamen padel. Pilih kategori untuk melihat tabel klasemen lengkap.
                        </p>
                    </div>

                    {/* Quick Stats & Live Indicator */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        {/* Digital Clock */}
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono font-bold text-zinc-200">
                            <Clock className="w-4 h-4 text-lime-400" />
                            <span>{currentTime || '00:00:00 WIB'}</span>
                        </div>

                        {/* Realtime Live Pulse */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-xs font-mono font-bold text-lime-400">
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                            <span>LIVE SYNC</span>
                        </div>

                        {/* Refresh Button */}
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isLoading || isRefetching}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer disabled:opacity-50"
                        >
                            <RotateCw
                                className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-lime-400' : ''}`}
                            />
                            <span>Segarkan</span>
                        </button>
                    </div>
                </header>

                {/* Tournament Stats Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-lime-400/10 text-lime-400 flex items-center justify-center font-bold">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Kategori Aktif</div>
                            <div className="text-xl font-black text-white font-mono">{totalCategories}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Total Grup</div>
                            <div className="text-xl font-black text-white font-mono">{totalGroups}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Total Tim</div>
                            <div className="text-xl font-black text-white font-mono">{totalTeams}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center font-bold">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Match Selesai</div>
                            <div className="text-xl font-black text-lime-400 font-mono">
                                {totalCompletedMatches}
                                <span className="text-xs text-zinc-500 font-normal"> / {totalMatches}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section: Loading / Error / Empty / Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((idx) => (
                            <div
                                key={idx}
                                className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-6 space-y-4 animate-pulse"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="h-5 w-24 bg-zinc-800 rounded-lg" />
                                    <div className="h-5 w-16 bg-zinc-800 rounded-lg" />
                                </div>
                                <div className="h-8 w-3/4 bg-zinc-800 rounded-lg" />
                                <div className="space-y-2 pt-2">
                                    <div className="h-12 w-full bg-zinc-800/60 rounded-xl" />
                                    <div className="h-12 w-full bg-zinc-800/60 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-900/40 text-center max-w-lg mx-auto space-y-3">
                        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
                        <h2 className="text-lg font-bold text-white">Gagal Memuat Klasemen</h2>
                        <p className="text-xs text-rose-300/80">
                            {error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data klasemen.'}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="mt-2 text-xs"
                        >
                            Coba Lagi
                        </Button>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-12 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center max-w-lg mx-auto space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-base font-bold text-white">Belum Ada Kategori dengan Grup</h2>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Klasemen akan muncul setelah panitia melakukan proses drawing dan pembagian grup pada kategori turnamen aktif.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((item) => (
                            <StandingsOverviewCard
                                key={item.category.id}
                                item={item}
                            />
                        ))}
                    </div>
                )}

                {/* Footer Notice */}
                <footer className="pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-lime-400" />
                        <span>Sistem Klasemen Padel Tournament — Update Otomatis Real-Time</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/display/courts" className="hover:text-lime-400 transition-colors">
                            &larr; Multi-Court Monitor
                        </Link>
                        <span>•</span>
                        <Link href="/" className="hover:text-lime-400 transition-colors">
                            Halaman Utama
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    )
}
