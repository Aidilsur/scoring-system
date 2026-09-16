'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Zap, AlertCircle } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { LiveScoringBoard } from './LiveScoringBoard'
import { useScoringManagement } from '@/hooks/useScoringManagement'

export interface MatchScoringViewProps {
    courtId: string
    matchId: string
    isReferee?: boolean
    userEmail?: string
}

export function MatchScoringView({
    courtId,
    matchId,
    isReferee = false,
    userEmail,
}: MatchScoringViewProps) {
    const router = useRouter()

    const {
        currentMatch,
        servingTeam,
        canUndo,
        isReadOnly,
        historyCount,
        isPending,
        pendingTeam,
        isMatchLoading,
        recordPoint,
        undoPoint,
        toggleServe,
        releaseControl,
    } = useScoringManagement(courtId, matchId, userEmail)

    const [isReleasing, setIsReleasing] = React.useState(false)

    const handleReleaseControl = async () => {
        setIsReleasing(true)
        try {
            const success = await releaseControl()
            if (success) {
                router.push(`/admin/scoring/${courtId}`)
            }
        } finally {
            setIsReleasing(false)
        }
    }

    const handleBack = () => {
        router.push(`/admin/scoring/${courtId}`)
    }

    if (isMatchLoading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-mono text-zinc-400">Memuat data pertandingan...</p>
                </div>
            </div>
        )
    }

    if (!currentMatch) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
                <div className="max-w-md mx-auto mt-20 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">Pertandingan Tidak Ditemukan</h3>
                    <p className="text-xs text-zinc-400">
                        Pertandingan dengan ID ini tidak ditemukan atau telah dihapus.
                    </p>
                    <Button
                        onClick={handleBack}
                        variant="primary"
                        size="sm"
                        className="w-full"
                    >
                        Kembali ke Jadwal Court
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Ringkas */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1 font-mono">
                            <Link href="/admin/scoring" className="hover:text-white transition-colors">
                                PORTAL SCORING
                            </Link>
                            <span>/</span>
                            <Link href={`/admin/scoring/${courtId}`} className="hover:text-white transition-colors">
                                {currentMatch.court?.name || 'COURT'}
                            </Link>
                            <span>/</span>
                            <span className="text-lime-400 font-bold">LIVE MATCH</span>
                        </div>

                        <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight flex items-center gap-2.5">
                            <Zap className="w-8 h-8 text-lime-400 fill-lime-400/20" />
                            Live Scoring
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant={isReferee ? 'warning' : 'success'} size="md">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {isReferee ? 'Wasit Lapangan' : 'Administrator'}
                        </Badge>
                    </div>
                </div>

                {/* Papan Skor Utama */}
                <LiveScoringBoard
                    match={currentMatch}
                    servingTeam={servingTeam}
                    canUndo={canUndo}
                    historyCount={historyCount}
                    isPending={isPending || isMatchLoading}
                    pendingTeam={pendingTeam}
                    isReadOnly={isReadOnly}
                    isReleasing={isReleasing}
                    onRecordPoint={recordPoint}
                    onUndoPoint={undoPoint}
                    onToggleServe={toggleServe}
                    onBack={handleBack}
                    onReleaseControl={handleReleaseControl}
                />
            </div>
        </div>
    )
}
