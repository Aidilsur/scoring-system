'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react'
import { Badge } from '@/components/ui'
import { useCourtsQuery } from '@/hooks/useCourtsQuery'

interface CourtSelectionViewProps {
    isReferee?: boolean
}

export function CourtSelectionView({ isReferee = false }: CourtSelectionViewProps) {
    const { data: courts, isLoading } = useCourtsQuery()

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Halaman */}
                <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800"
                >
                    <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1 font-mono">
                            <span>PORTAL SCORING</span>
                            <span>/</span>
                            <span className="text-lime-400 font-bold">PILIH COURT</span>
                        </div>

                        <h1
                            className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight flex items-center gap-2.5"
                        >
                            <Zap className="w-8 h-8 text-lime-400 fill-lime-400/20" />
                            Live Scoring Pertandingan
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1">
                            Pilih lapangan (court) untuk melihat jadwal pertandingan dan memulai pencatatan skor live.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant={isReferee ? 'warning' : 'success'} size="md">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {isReferee ? 'Wasit Lapangan' : 'Administrator'}
                        </Badge>
                    </div>
                </div>

                {/* Konten Pemilihan Court */}
                {isLoading ? (
                    <div className="p-12 text-center text-xs font-mono text-zinc-400">
                        Memuat daftar lapangan (court)...
                    </div>
                ) : !courts || courts.length === 0 ? (
                    <div
                        className="p-12 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-3"
                    >
                        <div
                            className="w-12 h-12 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto"
                        >
                            <Layers className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            Belum Ada Court yang Dikonfigurasi
                        </h4>
                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                            Silakan atur jumlah lapangan di Pengaturan Turnamen (/admin/tournament-setup) sebelum memulai scoring.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                            Pilih Lapangan ({courts.length} Court Tersedia)
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {courts.map((court) => (
                                <Link
                                    key={court.id}
                                    href={`/admin/scoring/${court.id}`}
                                    className="group relative p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-lime-400/80 hover:bg-zinc-900 transition-all duration-200 flex flex-col justify-between space-y-6 shadow-lg shadow-black/40 hover:shadow-lime-400/5 hover:-translate-y-0.5"
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                                                Lapangan Turnamen
                                            </span>
                                            <span className="w-2.5 h-2.5 rounded-full bg-lime-400/40 group-hover:bg-lime-400 transition-colors" />
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-lime-400 transition-colors">
                                            {court.name}
                                        </h3>
                                        <p className="text-xs text-zinc-400">
                                            Lihat jadwal antrean pertandingan &amp; mulai scoring di court ini.
                                        </p>
                                    </div>

                                    <div
                                        className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs font-bold text-lime-400 group-hover:translate-x-1 transition-transform"
                                    >
                                        <span>Buka Jadwal Court</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
