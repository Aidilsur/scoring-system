'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, AlertTriangle, Users } from 'lucide-react'
import { Button, Card, Badge } from '@/components/ui'
import { usePublicCategoriesQuery } from '@/hooks/usePublicCategoriesQuery'
import { formatCategoryBadge } from '@/utils/format'

export function HomeCategoriesSection() {
    const { data: categories, isLoading, isError } = usePublicCategoriesQuery()

    return (
        <section
            id="categories"
            className="h-screen min-h-screen w-full snap-start snap-always flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 sm:py-16 relative overflow-hidden bg-zinc-950 text-zinc-100"
        >
            {/* Background Accents (Consistent with Hero) */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-400/[0.02] rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl w-full mx-auto relative z-20 space-y-8 sm:space-y-12">
                {/* Section Header */}
                <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono tracking-widest text-lime-400 uppercase">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shadow-sm shadow-lime-400/50 shrink-0" />
                        <span className="font-bold">Registration Phase</span>
                    </div>
                    <h2
                        className="font-[family-name:var(--font-anton)] font-normal uppercase text-white tracking-tight drop-shadow-lg"
                        style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 0.95 }}
                    >
                        TOURNAMENT CATEGORIES
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-zinc-400 leading-relaxed">
                        Browse competition brackets organized by team type and player skill levels. Register your team before the slots are full.
                    </p>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-zinc-900/50 border border-zinc-800 rounded-2xl" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-6 text-rose-400 text-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>Gagal memuat data kategori. Silakan muat ulang halaman.</p>
                    </div>
                ) : !categories || categories.length === 0 ? (
                    <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-6 text-amber-400 text-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold mb-1">Belum ada kategori dibuka saat ini</p>
                            <p className="opacity-80">Panitia belum membuka pendaftaran untuk kategori apapun. Silakan kembali lagi nanti.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((cat) => (
                            <Card
                                key={cat.id}
                                className="group p-6 bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800 hover:border-lime-400/50 transition-all duration-300 flex flex-col h-full rounded-2xl shadow-lg hover:shadow-lime-400/5"
                            >
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-xl sm:text-2xl font-[family-name:var(--font-anton)] uppercase tracking-wide text-white group-hover:text-lime-300 transition-colors">
                                            {cat.name}
                                        </h3>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="neutral" size="sm" className="bg-zinc-950 text-zinc-300 border-zinc-800">
                                            {formatCategoryBadge(cat.partner_type, cat.level)}
                                        </Badge>
                                        <Badge variant="neutral" size="sm" className="bg-zinc-950 text-zinc-300 border-zinc-800 flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5 opacity-70" />
                                            {cat.team_count} Tim Terdaftar
                                        </Badge>
                                    </div>
                                </div>

                                <div className="mt-8 pt-5 border-t border-zinc-800/80">
                                    <Link href={`/register?category=${cat.id}`} className="block w-full">
                                        <Button
                                            variant="secondary"
                                            className="w-full bg-zinc-950 hover:bg-lime-400 text-zinc-300 hover:text-zinc-950 border border-zinc-800 hover:border-lime-400 transition-all rounded-xl"
                                        >
                                            <span className="font-bold">Daftar Kategori Ini</span>
                                            <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100" />
                                        </Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
