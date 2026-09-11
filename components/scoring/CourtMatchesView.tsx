'use client'

import React, { useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldCheck, Zap } from 'lucide-react'
import { Badge } from '@/components/ui'
import { CourtSelector } from './CourtSelector'
import { CourtMatchList } from './CourtMatchList'
import { useCourtsQuery } from '@/hooks/useCourtsQuery'
import { useCourtMatchesQuery } from '@/hooks/useCourtMatchesQuery'
import { useRealtimeMatch } from '@/hooks/useRealtimeMatch'
import { claimScorerSessionAction } from '@/app/admin/(protected)/scoring/actions'
import { getClientScorerSessionId } from '@/lib/scoring'
import { toast } from '@/lib/toast'

export interface CourtMatchesViewProps {
    courtId: string
    isReferee?: boolean
    userEmail?: string
}

export function CourtMatchesView({
    courtId,
    isReferee = false,
    userEmail,
}: CourtMatchesViewProps) {
    const router = useRouter()

    const courtsQuery = useCourtsQuery()
    const courtMatchesQuery = useCourtMatchesQuery(courtId)

    // Realtime sync untuk court ini
    useRealtimeMatch({
        courtId,
        matchId: null,
    })

    const courts = courtsQuery.data || []
    const selectedCourt = courts.find((c) => c.id === courtId)
    const matches = courtMatchesQuery.data?.matches || []
    const currentMatch = courtMatchesQuery.data?.currentMatch || null

    const handleSelectCourt = useCallback(
        (newCourtId: string) => {
            router.push(`/admin/scoring/${newCourtId}`)
        },
        [router]
    )

    const handleSelectMatch = useCallback(
        async (matchId: string) => {
            const targetMatch = matches.find((m) => m.id === matchId)
            const currentLiveMatch = matches.find((m) => m.status === 'live')

            // Jika match yang ingin dibuka berstatus 'scheduled' (belum live),
            // dan di court ini SUDAH ADA match lain yang sedang 'live', tolak dengan toast
            if (
                targetMatch &&
                targetMatch.status === 'scheduled' &&
                currentLiveMatch &&
                currentLiveMatch.id !== matchId
            ) {
                const teamA = `${currentLiveMatch.team_a?.player1_name || 'Tim A'}/${currentLiveMatch.team_a?.player2_name || ''}`.trim()
                const teamB = `${currentLiveMatch.team_b?.player1_name || 'Tim B'}/${currentLiveMatch.team_b?.player2_name || ''}`.trim()
                toast.error(
                    `Court ini masih memiliki pertandingan yang sedang berlangsung (${teamA} vs ${teamB}). Selesaikan atau tandai match tersebut terlebih dahulu sebelum memulai match baru.`
                )
                return
            }

            // 1. Dapatkan / generate session ID acak browser device tsb di sessionStorage
            const sessionId = getClientScorerSessionId()

            // 2. Klaim sesi scoring di database jika belum diklaim / expired
            if (sessionId) {
                try {
                    const claimRes = await claimScorerSessionAction(matchId, sessionId)
                    if (!claimRes.isOwner) {
                        toast.warning(
                            'Match ini sedang di-score oleh device lain. Halaman dibuka dalam mode Read-Only.'
                        )
                    }
                } catch (err) {
                    console.error('Error claiming session on select:', err)
                }
            }

            // 3. Pindah ke halaman nested live scoring
            router.push(`/admin/scoring/${courtId}/${matchId}`)
        },
        [matches, courtId, router]
    )

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header Halaman */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1 font-mono">
                            <Link
                                href="/admin/scoring"
                                className="hover:text-white transition-colors"
                            >
                                PORTAL SCORING
                            </Link>
                            <span>/</span>
                            <span className="text-lime-400 font-bold">
                                {selectedCourt?.name || 'COURT'}
                            </span>
                        </div>

                        <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight flex items-center gap-2.5">
                            <Zap className="w-8 h-8 text-lime-400 fill-lime-400/20" />
                            {selectedCourt?.name || 'Jadwal Court'}
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1">
                            Daftar pertandingan di {selectedCourt?.name || 'court ini'}. Pilih pertandingan untuk memulai live scoring.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/scoring"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:text-white hover:border-zinc-700 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Ganti Court</span>
                        </Link>
                        <Badge variant={isReferee ? 'warning' : 'success'} size="md">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {isReferee ? 'Wasit Lapangan' : 'Administrator'}
                        </Badge>
                    </div>
                </div>

                {/* Court Switcher Tabs */}
                {courts.length > 1 && (
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                        <CourtSelector
                            courts={courts}
                            selectedCourtId={courtId}
                            onSelectCourt={handleSelectCourt}
                            disabled={courtsQuery.isLoading}
                        />
                    </div>
                )}

                {/* List Pertandingan di Court Terpilih */}
                {courtMatchesQuery.isLoading ? (
                    <div className="p-12 text-center text-xs font-mono text-zinc-400">
                        Memuat jadwal pertandingan {selectedCourt?.name || ''}...
                    </div>
                ) : (
                    <CourtMatchList
                        matches={matches}
                        currentMatch={currentMatch}
                        onSelectMatch={handleSelectMatch}
                        courtName={selectedCourt?.name || 'Court'}
                    />
                )}
            </div>
        </div>
    )
}
