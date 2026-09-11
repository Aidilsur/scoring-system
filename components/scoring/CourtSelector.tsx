'use client'

import React from 'react'
import type { Court } from '@/types/domain'

export interface CourtSelectorProps {
    courts: Court[]
    selectedCourtId: string | null
    onSelectCourt: (courtId: string) => void
    disabled?: boolean
}

/**
 * CourtSelector: Komponen pemilih court aktif (horizontal pill / tabs)
 * Mengikuti pola docs/design-theme.md (aksesibilitas dan kontras tinggi)
 */
export function CourtSelector({
    courts,
    selectedCourtId,
    onSelectCourt,
    disabled = false,
}: CourtSelectorProps) {
    if (!courts || courts.length === 0) {
        return (
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs text-center">
                Belum ada data lapangan (court) yang dikonfigurasi.
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-1">
                Pilih Court:
            </span>
            {courts.map((court) => {
                const isSelected = court.id === selectedCourtId
                return (
                    <button
                        key={court.id}
                        type="button"
                        onClick={() => onSelectCourt(court.id)}
                        disabled={disabled}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0 ${
                            isSelected
                                ? 'bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/20 font-black scale-105'
                                : 'bg-zinc-900/80 text-zinc-300 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {court.name}
                    </button>
                )
            })}
        </div>
    )
}
