'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Radio,
    Clock,
    ArrowLeft,
    AlertCircle,
    RefreshCw,
    Network,
    Table,
    Trophy
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { PadelCourtGeometry } from './PadelCourtGeometry'
import { useCategoryBracketQuery } from '@/hooks/useBracketQuery'
import { BracketPairingCard } from '@/components/bracket/BracketPairingCard'
import { FinalPairingCard } from '@/components/bracket/FinalPairingCard'

interface CategoryBracketViewProps {
    categoryId: string
}

export function CategoryBracketView({ categoryId }: CategoryBracketViewProps) {
    const { data, isLoading, error, refetch } = useCategoryBracketQuery(categoryId)

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
    
    // Status flags
    const isGroupStageComplete = data?.isGroupStageComplete ?? false
    const hasExistingBracket = data?.hasExistingBracket ?? false
    const isSemifinalComplete = data?.isSemifinalComplete ?? false
    const hasExistingFinal = data?.hasExistingFinal ?? false
    const semifinalMatches = data?.semifinalMatches ?? []
    const finalMatch = data?.finalMatch
    const thirdPlaceMatch = data?.thirdPlaceMatch
    const thirdPlaceEnabled = data?.thirdPlaceEnabled ?? false

    return (
        <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden select-none flex flex-col">
            <PadelCourtGeometry />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 flex-1 w-full flex flex-col">
                {/* Header Broadcast Bar */}
                <header
                    className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-800/80 shrink-0"
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
                            <span className="text-white">Bracket</span>
                        </div>

                        <div className="space-y-1">
                            <h1
                                className="font-[family-name:var(--font-anton)] text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight flex items-center gap-3"
                            >
                                <Radio className="w-8 h-8 sm:w-10 sm:h-10 text-lime-400 animate-pulse" />
                                <span>{category?.name || 'Knockout Bracket'}</span>
                            </h1>

                            <p className="text-xs sm:text-sm text-zinc-400 font-mono">
                                Bracket Babak Gugur • Semifinal & Final
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats & Live Indicator */}
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                        <div
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono font-bold text-zinc-200"
                        >
                            <Clock className="w-4 h-4 text-lime-400" />
                            <span>{currentTime || '00:00:00 WIB'}</span>
                        </div>

                        <div
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-xs font-mono font-bold text-lime-400"
                        >
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping mr-0.5" />
                            <span>REALTIME SYNC</span>
                        </div>
                    </div>
                </header>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-4">
                        <div
                            className="w-12 h-12 border-3 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto"
                        />
                        <p className="text-sm font-mono text-zinc-400">
                            Memuat data bracket turnamen...
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
                        <h3 className="text-base font-bold text-white">Gagal Memuat Bracket</h3>
                        <p className="text-xs text-zinc-400">
                            {error instanceof Error ? error.message : 'Terjadi kendala saat mengambil data bracket.'}
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

                {/* State 1: Group Stage Not Complete */}
                {!isLoading && !error && !isGroupStageComplete && (
                    <div
                        className="max-w-lg mx-auto my-16 p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-4"
                    >
                        <div
                            className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto"
                        >
                            <Table className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Fase Grup Belum Selesai</h3>
                        <p className="text-xs text-zinc-400">
                            Pertandingan fase grup masih berlangsung ({data?.completedGroupMatches} dari {data?.totalGroupMatches} match selesai). Bracket semifinal akan tersedia setelah seluruh match grup tuntas.
                        </p>
                    </div>
                )}

                {/* State 2: Group Complete, but no bracket generated */}
                {!isLoading && !error && isGroupStageComplete && !hasExistingBracket && (
                    <div
                        className="max-w-lg mx-auto my-16 p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-4"
                    >
                        <div
                            className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto"
                        >
                            <Network className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Menunggu Drawing Semifinal</h3>
                        <p className="text-xs text-zinc-400">
                            Fase grup telah selesai. Bracket semifinal belum dibuat oleh panitia turnamen.
                        </p>
                    </div>
                )}

                {/* State 3/4/5: Bracket Exists */}
                {!isLoading && !error && hasExistingBracket && (
                    <div className="flex-1 flex flex-col items-center justify-center py-8">
                        {/* Horizontal Tree Layout */}
                        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center lg:items-stretch w-full max-w-5xl mx-auto">
                            
                            {/* Semifinal Column */}
                            <div className="flex flex-col w-full lg:w-1/2 relative z-10 shrink-0">
                                {semifinalMatches.map((match, i) => (
                                    <div key={match.id} className="flex-1 flex flex-row items-center relative py-4 lg:py-6">
                                        <div className="flex-1 z-10 pr-4 lg:pr-0">
                                            <BracketPairingCard match={match} matchIndex={i} />
                                        </div>
                                        
                                        {/* Connector lines (Desktop only) */}
                                        {hasExistingFinal && semifinalMatches.length === 2 && (
                                            <>
                                                {/* Horizontal line coming out of the card */}
                                                <div className="hidden lg:block w-8 lg:w-12 h-[2px] bg-zinc-700/80 z-0 shrink-0" />
                                                
                                                {/* Vertical spine (upper half for Semi 1, lower half for Semi 2) */}
                                                <div 
                                                    className={cn(
                                                        "hidden lg:block absolute right-0 w-2 border-r-[2px] border-zinc-700/80 z-0",
                                                        i === 0 ? "bottom-0 h-[calc(50%+1px)]" : "top-0 h-[calc(50%+1px)]"
                                                    )}
                                                />
                                            </>
                                        )}
                                    </div>
                                ))}

                                {/* The middle horizontal line that connects the Semifinal spine to the Final column */}
                                {hasExistingFinal && semifinalMatches.length === 2 && (
                                    <div className="hidden lg:block absolute top-1/2 right-0 w-12 lg:w-16 h-[2px] bg-zinc-700/80 z-0 translate-x-full" />
                                )}
                            </div>

                            {/* Final Column */}
                            <div className="flex flex-col justify-center gap-8 w-full lg:w-1/2 relative z-10 shrink-0">
                                {hasExistingFinal && finalMatch ? (
                                    <div className="flex flex-col gap-6">
                                        <FinalPairingCard match={finalMatch} type="final" />
                                        
                                        {thirdPlaceEnabled && thirdPlaceMatch && (
                                            <div className="mt-4">
                                                <FinalPairingCard match={thirdPlaceMatch} type="third_place" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    isSemifinalComplete ? (
                                        <div className="p-8 border border-dashed border-zinc-700/80 rounded-2xl bg-zinc-900/40 text-center flex flex-col items-center justify-center min-h-[200px]">
                                            <Trophy className="w-8 h-8 text-zinc-600 mb-3" />
                                            <h3 className="text-sm font-bold text-white mb-1">Semifinal Selesai</h3>
                                            <p className="text-xs font-mono text-zinc-400">
                                                Menunggu babak final dibuat admin
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="hidden lg:flex p-8 border border-dashed border-zinc-800/50 rounded-2xl bg-zinc-950/20 text-center flex-col items-center justify-center min-h-[200px] opacity-50">
                                            <Network className="w-8 h-8 text-zinc-700 mb-3" />
                                            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                                                Slot Final
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Navigasi */}
                <footer
                    className="pt-8 mt-auto border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400 shrink-0"
                >
                    <div className="flex items-center gap-4">
                        <span className="text-zinc-300 font-semibold">Padel Scoring System</span>
                        <span>•</span>
                        <span>Official Bracket Engine</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href={`/display/standings/${categoryId}`}
                            className="hover:text-lime-400 transition-colors"
                        >
                            Klasemen Grup
                        </Link>
                        <span>•</span>
                        <Link
                            href="/display/courts"
                            className="hover:text-lime-400 transition-colors"
                        >
                            Multi-Court Monitor
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    )
}
