'use client'

import React from 'react'
import { AlertTriangle, Clock, PlusCircle, Sliders, X } from 'lucide-react'
import Link from 'next/link'
import { Match } from '@/types/domain'

export interface ScheduleWarningCardProps {
    unscheduledMatches: Match[]
    onDismiss?: () => void
}

export function ScheduleWarningCard({
    unscheduledMatches,
    onDismiss,
}: ScheduleWarningCardProps) {
    if (!unscheduledMatches || unscheduledMatches.length === 0) return null

    return (
        <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <h4 className="font-bold text-sm text-white uppercase tracking-wide">
                        Peringatan: {unscheduledMatches.length} Pertandingan Tidak Muat dalam Jam Operasional
                    </h4>
                </div>
                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                        aria-label="Tutup pemberitahuan"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <p className="text-xs text-amber-200/90 leading-relaxed">
                Sistem tidak dapat menjadwalkan seluruh pertandingan tanpa melanggar aturan wajib jeda 1 ronde antar pertandingan tim atau batas jam selesai harian.
            </p>

            {/* List of Unscheduled Matches */}
            <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Daftar Pertandingan Belum Terjadwal:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {unscheduledMatches.map((m) => (
                        <div
                            key={m.id}
                            className="text-xs px-3 py-2 rounded-xl bg-black/40 border border-amber-500/20 text-zinc-300 flex items-center justify-between"
                        >
                            <span className="font-semibold text-white">
                                {m.team_a?.player1_name || 'Tim A'} / {m.team_a?.player2_name || ''} vs{' '}
                                {m.team_b?.player1_name || 'Tim B'} / {m.team_b?.player2_name || ''}
                            </span>
                            {m.group && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                    {m.group.name}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Suggested Remedies */}
            <div className="pt-2 border-t border-amber-500/20 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Rekomendasi Solusi untuk Admin:
                </div>
                <ul className="text-xs text-amber-200/80 space-y-1.5 list-disc pl-4">
                    <li>
                        <strong>Perpanjang Jam Operasional Turnamen:</strong> Tambah jam selesai di{' '}
                        <Link
                            href="/admin/tournament-setup"
                            className="underline text-lime-400 hover:text-lime-300 font-bold"
                        >
                            Setup Turnamen
                        </Link>{' '}
                        (misal dari 18:00 ke 20:00).
                    </li>
                    <li>
                        <strong>Tambah Jumlah Court:</strong> Tambahkan slot court aktif agar lebih banyak pertandingan dapat dimainkan secara paralel.
                    </li>
                    <li>
                        <strong>Kurangi Durasi Estimasi per Match:</strong> Sesuaikan estimasi alokasi waktu per match (misal dari 45 menit ke 35 menit).
                    </li>
                </ul>
            </div>
        </div>
    )
}
