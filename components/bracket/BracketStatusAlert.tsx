import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Trophy } from 'lucide-react'

export interface BracketStatusAlertProps {
    groupCount: number
    isTwoGroups: boolean
    isGroupStageComplete: boolean
    totalGroupMatches: number
    remainingGroupMatches: number
    hasExistingBracket: boolean
}

export function BracketStatusAlert({
    groupCount,
    isTwoGroups,
    isGroupStageComplete,
    totalGroupMatches,
    remainingGroupMatches,
    hasExistingBracket,
}: BracketStatusAlertProps) {
    // 1. Kasus jumlah grup selain 2
    if (!isTwoGroups) {
        return (
            <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h3 className="font-bold text-sm text-amber-200">
                        Bracket untuk {groupCount} grup belum didukung
                    </h3>
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                        Sesuai regulasi turnamen saat ini, pembuatan otomatis bracket knockout hanya mendukung kategori dengan format tepat 2 grup (Pola Silang Semifinal).
                    </p>
                </div>
            </div>
        )
    }

    // 2. Kasus fase grup belum selesai
    if (!isGroupStageComplete) {
        return (
            <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h3 className="font-bold text-sm text-amber-200">
                        Fase grup belum selesai, {remainingGroupMatches} dari {totalGroupMatches} match masih berjalan
                    </h3>
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                        Seluruh pertandingan babak penyisihan grup harus berstatus selesai (completed) sebelum peringkat grup dapat dikunci dan bracket semifinal dibuat.
                    </p>
                </div>
            </div>
        )
    }

    // 3. Kasus bracket sudah pernah dibuat
    if (hasExistingBracket) {
        return (
            <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-lime-500/30 text-zinc-200">
                <Trophy className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                        Bracket Semifinal Aktif
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Pertandingan semifinal telah berhasil dibuat berdasarkan klasemen akhir fase grup. Anda dapat mengatur jadwal lapangan di menu Penjadwalan.
                    </p>
                </div>
            </div>
        )
    }

    // 4. Kasus siap generate bracket
    return (
        <div className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-lime-500/10 border border-lime-500/30 text-lime-300">
            <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
                <h3 className="font-bold text-sm text-lime-200">
                    Fase Grup Selesai — Siap Membuat Bracket
                </h3>
                <p className="text-xs text-lime-300/80 leading-relaxed">
                    Semua {totalGroupMatches} pertandingan fase grup telah rampung. Peringkat juara dan runner-up dari 2 grup telah terkunci dan siap dipasangkan di babak semifinal.
                </p>
            </div>
        </div>
    )
}
