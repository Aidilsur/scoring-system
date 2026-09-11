'use client'

import { useState, useCallback, useTransition, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCourtsQuery } from './useCourtsQuery'
import { useCourtMatchesQuery, courtMatchesQueryKey } from './useCourtMatchesQuery'
import { useMatchDetailQuery, matchDetailQueryKey } from './useMatchDetailQuery'
import { useRealtimeMatch } from './useRealtimeMatch'
import {
    recordPointAction,
    undoLastPointAction,
    claimScorerSessionAction,
} from '@/app/admin/(protected)/scoring/actions'
import { getClientScorerSessionId } from '@/lib/scoring'
import { toast } from '@/lib/toast'
import type { MatchTeam } from '@/lib/scoring'

export function useScoringManagement(
    initialCourtId?: string | null,
    initialMatchId?: string | null
) {
    const queryClient = useQueryClient()
    const [isPending, startTransition] = useTransition()

    // 1. Session State (per browser device/tab)
    const [clientSessionId] = useState<string>(() => getClientScorerSessionId())

    // 2. Selection State
    const [internalCourtId, setInternalCourtId] = useState<string | null>(initialCourtId || null)
    const [internalMatchId, setInternalMatchId] = useState<string | null>(initialMatchId || null)
    const [servingTeam, setServingTeam] = useState<MatchTeam>('team_a')

    // 3. Data Queries
    const courtsQuery = useCourtsQuery()
    const defaultCourtId = courtsQuery.data?.[0]?.id || null

    const selectedCourtId = initialCourtId ?? internalCourtId ?? defaultCourtId
    const selectedMatchId = initialMatchId ?? internalMatchId

    const courtMatchesQuery = useCourtMatchesQuery(selectedCourtId)
    const matchDetailQuery = useMatchDetailQuery(selectedMatchId, clientSessionId)

    // 4. Klaim Sesi Scoring saat match aktif dipilih
    useEffect(() => {
        if (!selectedMatchId || !clientSessionId) return

        let isCancelled = false

        async function claimSession() {
            try {
                const res = await claimScorerSessionAction(selectedMatchId!, clientSessionId)
                if (isCancelled) return

                if (!res.isOwner) {
                    toast.warning('Match ini sedang di-score oleh device lain. Mode Read-Only diaktifkan.')
                }

                // Invalidate query agar UI langsung sinkron dengan status kepemilikan sesi
                queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) })
            } catch (err) {
                console.error('Failed to claim session:', err)
            }
        }

        claimSession()

        return () => {
            isCancelled = true
        }
    }, [selectedMatchId, clientSessionId, queryClient])

    // 4b. Heartbeat auto-renewal jika device ini pemegang sesi aktif (tiap 2 menit)
    useEffect(() => {
        if (!selectedMatchId || !clientSessionId) return
        if (matchDetailQuery.data?.isReadOnly) return
        if (matchDetailQuery.data?.match?.status === 'completed') return

        const intervalId = setInterval(async () => {
            try {
                await claimScorerSessionAction(selectedMatchId, clientSessionId)
            } catch {
                // Heartbeat silent catch
            }
        }, 2 * 60 * 1000)

        return () => {
            clearInterval(intervalId)
        }
    }, [selectedMatchId, clientSessionId, matchDetailQuery.data?.isReadOnly, matchDetailQuery.data?.match?.status])

    // 5. Supabase Realtime Subscription
    useRealtimeMatch({
        matchId: selectedMatchId,
        courtId: selectedCourtId,
    })

    // 6. Change Handlers
    const selectCourt = useCallback((courtId: string) => {
        setInternalCourtId(courtId)
        setInternalMatchId(null) // Reset match selection when court changes
    }, [])

    const selectMatch = useCallback(
        (matchId: string) => {
            const matches = courtMatchesQuery.data?.matches || []
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

            setInternalMatchId(matchId)
        },
        [courtMatchesQuery.data?.matches]
    )

    const backToMatchList = useCallback(() => {
        setInternalMatchId(null)
    }, [])

    const toggleServe = useCallback((team?: MatchTeam) => {
        if (team) {
            setServingTeam(team)
        } else {
            setServingTeam((prev) => (prev === 'team_a' ? 'team_b' : 'team_a'))
        }
    }, [])

    // 7. Scoring Server Action Handlers (dengan CAS Client Session ID)
    const recordPoint = useCallback(
        (winningTeam: MatchTeam) => {
            if (!selectedMatchId || isPending) return

            startTransition(async () => {
                try {
                    const result = await recordPointAction(
                        selectedMatchId,
                        winningTeam,
                        clientSessionId
                    )

                    if (!result.success) {
                        toast.error(result.message)
                        // Refresh status match jika ditolak karena kepemilikan sesi berubah
                        queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) })
                        return
                    }

                    // Feedback toast jika pertandingan selesai
                    if (result.data?.status === 'completed') {
                        toast.success('Pertandingan selesai!', result.message)
                    }

                    // Refresh query cache
                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) }),
                        queryClient.invalidateQueries({ queryKey: courtMatchesQueryKey(selectedCourtId) }),
                    ])
                } catch (err: unknown) {
                    const errorMsg = err instanceof Error ? err.message : 'Gagal mencatat poin.'
                    toast.error(errorMsg)
                }
            })
        },
        [selectedMatchId, selectedCourtId, clientSessionId, isPending, queryClient]
    )

    const undoPoint = useCallback(() => {
        if (!selectedMatchId || isPending) return

        startTransition(async () => {
            try {
                const result = await undoLastPointAction(selectedMatchId, clientSessionId)

                if (!result.success) {
                    toast.error(result.message)
                    queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) })
                    return
                }

                toast.success(result.message)

                // Refresh query cache
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) }),
                    queryClient.invalidateQueries({ queryKey: courtMatchesQueryKey(selectedCourtId) }),
                ])
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : 'Gagal melakukan undo poin.'
                toast.error(errorMsg)
            }
        })
    }, [selectedMatchId, selectedCourtId, clientSessionId, isPending, queryClient])

    return {
        // Selection & Session state
        selectedCourtId,
        selectedMatchId,
        clientSessionId,
        servingTeam,
        isPending,

        // Data
        courts: courtsQuery.data || [],
        isCourtsLoading: courtsQuery.isLoading,

        courtMatches: courtMatchesQuery.data?.matches || [],
        currentCourtMatch: courtMatchesQuery.data?.currentMatch || null,
        isMatchesLoading: courtMatchesQuery.isLoading,

        currentMatch: matchDetailQuery.data?.match || null,
        canUndo: Boolean(matchDetailQuery.data?.canUndo),
        isReadOnly: Boolean(matchDetailQuery.data?.isReadOnly),
        isClaimedByOther: Boolean(matchDetailQuery.data?.isClaimedByOther),
        historyCount: matchDetailQuery.data?.historyCount || 0,
        isMatchLoading: matchDetailQuery.isLoading,

        // Handlers
        selectCourt,
        selectMatch,
        backToMatchList,
        toggleServe,
        recordPoint,
        undoPoint,
    }
}
