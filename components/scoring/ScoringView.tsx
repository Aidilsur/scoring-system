'use client'

import React from 'react'
import { Zap, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui'
import { CourtSelector } from './CourtSelector'
import { CourtMatchList } from './CourtMatchList'
import { LiveScoringBoard } from './LiveScoringBoard'
import { useScoringManagement } from '@/hooks/useScoringManagement'

export interface ScoringViewProps {
    isReferee?: boolean
    userEmail?: string
}

/**
 * ScoringView: Komponen Container View utama modul scoring wasit / admin.
 * Memisahkan mode pemilihan court & match list dengan mode papan scoring aktif.
 */
export function ScoringView({ isReferee = false, userEmail }: ScoringViewProps) {
    const {
        selectedCourtId,
        selectedMatchId,
        servingTeam,
        isPending,
        courts,
        isCourtsLoading,
        courtMatches,
        currentCourtMatch,
        isMatchesLoading,
        currentMatch,
        canUndo,
        historyCount,
        isMatchLoading,
        selectCourt,
        selectMatch,
        backToMatchList,
        toggleServe,
        recordPoint,
        undoPoint,
    } = useScoringManagement()

    const selectedCourt = courts.find((c) => c.id === selectedCourtId)

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Halaman */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1 font-mono">
                            <span>PORTAL SCORING</span>
                            {selectedCourt && (
                                <>
                                    <span>/</span>
                                    <span className="text-lime-400 font-bold">{selectedCourt.name}</span>
                                </>
                            )}
                            {currentMatch && (
                                <>
                                    <span>/</span>
                                    <span className="text-white">MATCH AKTIF</span>
                                </>
                            )}
                        </div>

                        <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight flex items-center gap-2.5">
                            <Zap className="w-8 h-8 text-lime-400 fill-lime-400/20" />
                            Live Scoring Pertandingan
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1">
                            Pencatatan skor real-time turnamen padel per court untuk wasit &amp; panitia.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant={isReferee ? 'warning' : 'success'} size="md">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {isReferee ? 'Wasit Lapangan' : 'Administrator'}
                        </Badge>
                    </div>
                </div>

                {/* MODE 1: PAPAN LIVE SCORING AKTIF (Saat ada match dipilih) */}
                {selectedMatchId && currentMatch ? (
                    <LiveScoringBoard
                        match={currentMatch}
                        servingTeam={servingTeam}
                        canUndo={canUndo}
                        historyCount={historyCount}
                        isPending={isPending || isMatchLoading}
                        onRecordPoint={recordPoint}
                        onUndoPoint={undoPoint}
                        onToggleServe={toggleServe}
                        onBack={backToMatchList}
                    />
                ) : (
                    /* MODE 2: PILIH COURT & LIHAT DAFTAR JADWAL COURT */
                    <div className="space-y-6">
                        {/* Selector Court Tabs */}
                        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                            <CourtSelector
                                courts={courts}
                                selectedCourtId={selectedCourtId}
                                onSelectCourt={selectCourt}
                                disabled={isCourtsLoading}
                            />
                        </div>

                        {/* List Pertandingan di Court Terpilih */}
                        {isMatchesLoading ? (
                            <div className="p-12 text-center text-xs font-mono text-zinc-400">
                                Memuat jadwal pertandingan {selectedCourt?.name || ''}...
                            </div>
                        ) : (
                            <CourtMatchList
                                matches={courtMatches}
                                currentMatch={currentCourtMatch}
                                onSelectMatch={selectMatch}
                                courtName={selectedCourt?.name || 'Court'}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ScoringView
