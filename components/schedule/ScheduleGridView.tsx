'use client'

import React, { useMemo } from 'react'
import { Clock, MapPin } from 'lucide-react'
import { Card } from '@/components/ui'
import { MATCH_STATUS_CONFIG } from '@/lib/scoring'
import { Match, Court } from '@/types/domain'
import { OccupiedCategorySlot } from '@/hooks/useScheduleQuery'

interface ScheduleGridViewProps {
    courts: Court[]
    scheduledMatches: Match[]
    occupiedSlots?: OccupiedCategorySlot[]
    startTime?: string
    endTime?: string
    durationMinutes?: number
}

const CATEGORY_COLOR_PALETTES = [
    {
        name: 'Lime',
        badgeClass: 'bg-lime-400/20 text-lime-300 border-lime-400/40',
        cardClass: 'border-lime-500/40 bg-zinc-950/90 hover:border-lime-400/80',
        dotClass: 'bg-lime-400',
    },
    {
        name: 'Cyan',
        badgeClass: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40',
        cardClass: 'border-cyan-500/40 bg-zinc-950/90 hover:border-cyan-400/80',
        dotClass: 'bg-cyan-400',
    },
    {
        name: 'Purple',
        badgeClass: 'bg-purple-400/20 text-purple-300 border-purple-400/40',
        cardClass: 'border-purple-500/40 bg-zinc-950/90 hover:border-purple-400/80',
        dotClass: 'bg-purple-400',
    },
    {
        name: 'Amber',
        badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
        cardClass: 'border-amber-500/40 bg-zinc-950/90 hover:border-amber-400/80',
        dotClass: 'bg-amber-400',
    },
    {
        name: 'Rose',
        badgeClass: 'bg-rose-400/20 text-rose-300 border-rose-400/40',
        cardClass: 'border-rose-500/40 bg-zinc-950/90 hover:border-rose-400/80',
        dotClass: 'bg-rose-400',
    },
    {
        name: 'Emerald',
        badgeClass: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40',
        cardClass: 'border-emerald-500/40 bg-zinc-950/90 hover:border-emerald-400/80',
        dotClass: 'bg-emerald-400',
    },
]

function extractTime(timestamp?: string | null): string {
    if (!timestamp) return ''
    if (timestamp.includes('T')) {
        const timePart = timestamp.split('T')[1]
        return timePart ? timePart.slice(0, 5) : ''
    }
    if (timestamp.includes(':')) {
        return timePartClean(timestamp)
    }
    return timestamp
}

function timePartClean(t: string): string {
    return t.slice(0, 5)
}

export function ScheduleGridView({
    courts,
    scheduledMatches,
    occupiedSlots = [],
}: ScheduleGridViewProps) {
    // 1. Buat mapping palet warna yang konsisten per kategori
    const { categoryPaletteMap, categoryNamesMap } = useMemo(() => {
        const pMap = new Map<string, (typeof CATEGORY_COLOR_PALETTES)[0]>()
        const nMap = new Map<string, string>()
        let idx = 0

        scheduledMatches.forEach((m) => {
            const catId = m.category_id || m.category?.id
            if (catId && !pMap.has(catId)) {
                const palette = CATEGORY_COLOR_PALETTES[idx % CATEGORY_COLOR_PALETTES.length]
                pMap.set(catId, palette)
                nMap.set(catId, m.category?.name || `Kategori ${idx + 1}`)
                idx++
            }
        })

        return { categoryPaletteMap: pMap, categoryNamesMap: nMap }
    }, [scheduledMatches])

    if (!scheduledMatches || scheduledMatches.length === 0) {
        return (
            <Card className="p-12 text-center bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                <p className="text-sm text-zinc-400 font-medium">
                    Belum ada jadwal pertandingan yang digenerate untuk tampilan ini.
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                    Klik tombol &ldquo;Generate Jadwal&rdquo; di atas untuk menyusun jadwal otomatis.
                </p>
            </Card>
        )
    }

    // 2. Kumpulkan semua slot waktu unik yang terpakai
    const timeSet = new Set<string>()

    scheduledMatches.forEach((m) => {
        const time = extractTime(m.scheduled_time)
        if (time) timeSet.add(time)
    })

    occupiedSlots.forEach((s) => {
        if (s.scheduledTime) timeSet.add(s.scheduledTime)
    })

    // Urutkan waktu secara kronologis
    const sortedTimes = Array.from(timeSet).sort((a, b) => a.localeCompare(b))

    // 3. Buat mapping (time -> courtId -> match)
    const scheduleMatrix = new Map<string, Map<string, Match>>()
    scheduledMatches.forEach((m) => {
        const time = extractTime(m.scheduled_time)
        if (time && m.court_id) {
            if (!scheduleMatrix.has(time)) {
                scheduleMatrix.set(time, new Map())
            }
            scheduleMatrix.get(time)!.set(m.court_id, m)
        }
    })

    // 4. Buat mapping (time -> courtId -> occupiedInfo)
    const occupiedMatrix = new Map<string, Map<string, OccupiedCategorySlot>>()
    occupiedSlots.forEach((s) => {
        if (s.scheduledTime && s.courtId) {
            if (!occupiedMatrix.has(s.scheduledTime)) {
                occupiedMatrix.set(s.scheduledTime, new Map())
            }
            occupiedMatrix.get(s.scheduledTime)!.set(s.courtId, s)
        }
    })

    return (
        <Card
            className="p-6 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-5 text-white shadow-xl"
        >
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800"
            >
                <div>
                    <h3
                        className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2"
                    >
                        <Clock className="w-4 h-4 text-lime-400" />
                        Jadwal Pertandingan (Timetable Grid)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Matriks pembagian waktu dan lapangan. Setiap baris mewakili 1 ronde
                        pertandingan.
                    </p>
                </div>

                {/* Legend Kategori */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    {Array.from(categoryPaletteMap.entries()).map(([catId, pal]) => (
                        <span key={catId} className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${pal.dotClass}`} />
                            <span className="text-zinc-300 font-medium">
                                {categoryNamesMap.get(catId) || 'Kategori'}
                            </span>
                        </span>
                    ))}
                    {occupiedSlots.length > 0 && (
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            Kategori Lain
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <span
                            className="w-2.5 h-2.5 rounded-full border border-dashed border-zinc-600"
                        />
                        Jeda Istirahat
                    </span>
                </div>
            </div>

            {/* Timetable Table Grid */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/70">
                            <th
                                className="py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider text-lime-400 w-28"
                            >
                                Waktu
                            </th>
                            {courts.map((court) => (
                                <th
                                    key={court.id}
                                    className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-zinc-200"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-lime-400" />
                                        <span>{court.name}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                        {sortedTimes.map((time) => {
                            const courtMap = scheduleMatrix.get(time)
                            const occMap = occupiedMatrix.get(time)

                            return (
                                <tr key={time} className="hover:bg-zinc-900/50 transition">
                                    {/* Kolom Waktu */}
                                    <td
                                        className="py-3.5 px-4 font-mono text-xs font-bold text-white align-top bg-zinc-950/40"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="px-2 py-1 rounded-lg bg-zinc-800 text-lime-300">
                                                {time}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Kolom Court */}
                                    {courts.map((court) => {
                                        const match = courtMap?.get(court.id)
                                        const occupiedSlot = occMap?.get(court.id)

                                        if (match) {
                                            const catId =
                                                match.category_id || match.category?.id || ''
                                            const pal =
                                                categoryPaletteMap.get(catId) ||
                                                CATEGORY_COLOR_PALETTES[0]

                                            return (
                                                <td key={court.id} className="py-3 px-3 align-top">
                                                    <div
                                                        className={`p-3 rounded-xl border ${pal.cardClass} transition space-y-2 shadow-md`}
                                                    >
                                                        {/* Category & Group Badges + Match Status */}
                                                        <div
                                                            className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]"
                                                        >
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                {match.category?.name && (
                                                                    <span
                                                                        className={`font-bold px-1.5 py-0.5 rounded text-[10px] border ${pal.badgeClass}`}
                                                                    >
                                                                        {match.category.name}
                                                                    </span>
                                                                )}
                                                                {match.group && (
                                                                    <span
                                                                        className="font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-300 text-[10px] border border-zinc-700"
                                                                    >
                                                                        {match.group.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {match.status === 'live' ? (
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-lime-400 uppercase"
                                                                >
                                                                    <span
                                                                        className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"
                                                                    />
                                                                    {MATCH_STATUS_CONFIG.live.label}
                                                                </span>
                                                            ) : match.status === 'completed' ? (
                                                                <span
                                                                    className="text-[10px] text-zinc-400 font-semibold uppercase"
                                                                >
                                                                    {MATCH_STATUS_CONFIG.completed.label}
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    className="text-[10px] text-zinc-500 font-mono uppercase"
                                                                >
                                                                    {MATCH_STATUS_CONFIG.scheduled.label}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Teams Names */}
                                                        <div className="text-xs space-y-1">
                                                            <div className="font-bold text-white truncate">
                                                                {match.team_a?.player1_name || 'Tim A'} /{' '}
                                                                {match.team_a?.player2_name || ''}
                                                            </div>
                                                            <div className="text-[10px] text-zinc-500 font-mono">
                                                                vs
                                                            </div>
                                                            <div className="font-bold text-white truncate">
                                                                {match.team_b?.player1_name || 'Tim B'} /{' '}
                                                                {match.team_b?.player2_name || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )
                                        }

                                        if (occupiedSlot) {
                                            return (
                                                <td key={court.id} className="py-3 px-3 align-top">
                                                    <div
                                                        className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 space-y-1"
                                                    >
                                                        <div
                                                            className="text-[10px] font-bold uppercase tracking-wider text-zinc-400"
                                                        >
                                                            Slot Terpakai
                                                        </div>
                                                        <div
                                                            className="text-xs font-semibold text-zinc-300 truncate"
                                                        >
                                                            {occupiedSlot.categoryName || 'Kategori Lain'}
                                                        </div>
                                                        <div className="text-[10px] text-zinc-600">
                                                            Resource bersama
                                                        </div>
                                                    </div>
                                                </td>
                                            )
                                        }

                                        return (
                                            <td key={court.id} className="py-3 px-3 align-top">
                                                <div
                                                    className="p-3 rounded-xl border border-dashed border-zinc-800/80 text-zinc-600 text-xs flex flex-col items-center justify-center min-h-[82px]"
                                                >
                                                    <span className="text-[11px] font-mono">
                                                        Istirahat / Kosong
                                                    </span>
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}
