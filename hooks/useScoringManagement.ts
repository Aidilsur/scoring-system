'use client'

import { useState, useCallback, useTransition, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCourtsQuery } from './useCourtsQuery'
import { useCourtMatchesQuery, courtMatchesQueryKey } from './useCourtMatchesQuery'
import { useMatchDetailQuery, matchDetailQueryKey, type MatchDetailData } from './useMatchDetailQuery'
import { useRealtimeMatch } from './useRealtimeMatch'
import {
    recordPointAction,
    undoLastPointAction,
    claimScorerSessionAction,
    heartbeatScorerSessionAction,
    releaseScorerSessionAction,
} from '@/app/admin/(protected)/scoring/actions'
import { HEARTBEAT_INTERVAL_MS } from '@/lib/scoring'
import { toast } from '@/lib/toast'
import type { MatchTeam } from '@/lib/scoring'
import type { Match } from '@/types/domain'

export function useScoringManagement(
    initialCourtId?: string | null,
    initialMatchId?: string | null,
    initialUserEmail?: string | null
) {
    const queryClient = useQueryClient()
    const [isPending, startTransition] = useTransition()
    const [pendingTeam, setPendingTeam] = useState<MatchTeam | null>(null)

    // 1. Identitas User (Email dari Supabase Auth / admin_users)
    const [userEmail, setUserEmail] = useState<string | null>(
        initialUserEmail?.toLowerCase().trim() || null
    )

    useEffect(() => {
        if (initialUserEmail) {
            setUserEmail(initialUserEmail.toLowerCase().trim())
            return
        }
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user?.email) {
                setUserEmail(data.user.email.toLowerCase().trim())
            }
        })
    }, [initialUserEmail])

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
    const matchDetailQuery = useMatchDetailQuery(selectedMatchId, userEmail || undefined)

    // Match data langsung dari server (tidak menggunakan optimistic update)
    const currentMatch = matchDetailQuery.data?.match || null

    // 4. Klaim Sesi Scoring saat match aktif dipilih
    useEffect(() => {
        if (!selectedMatchId) return

        let isCancelled = false

        async function claimSession() {
            try {
                const res = await claimScorerSessionAction(selectedMatchId!, userEmail || undefined)
                if (isCancelled) return

                if (!res.isOwner) {
                    toast.warning(res.message || 'Match ini sedang di-score oleh akun lain. Mode Read-Only diaktifkan.')
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
    }, [selectedMatchId, userEmail, queryClient])

    // Melacak apakah user ini adalah pemegang kendali aktif
    const isOwner = Boolean(
        selectedMatchId &&
        !matchDetailQuery.data?.isReadOnly &&
        userEmail &&
        matchDetailQuery.data?.match?.active_scorer_session_id?.toLowerCase().trim() === userEmail &&
        matchDetailQuery.data?.match?.status !== 'completed'
    )
    const isOwnerRef = useRef(isOwner)
    isOwnerRef.current = isOwner

    // 4b. Heartbeat berkala (setiap 30 detik) saat tab visible/focused
    // Memperpanjang active_scorer_claimed_at ke waktu sekarang.
    // Jika tab hidden/background, interval dihentikan agar lock dapat kadaluarsa jika ditinggalkan.
    useEffect(() => {
        if (!selectedMatchId) return
        if (matchDetailQuery.data?.isReadOnly) return
        if (matchDetailQuery.data?.match?.status === 'completed') return

        let timerId: ReturnType<typeof setInterval> | null = null

        const triggerHeartbeat = async () => {
            if (document.visibilityState !== 'visible') return
            try {
                const res = await heartbeatScorerSessionAction(selectedMatchId, userEmail || undefined)
                if (!res.isOwner) {
                    // Jika kepemilikan lock sudah beralih di server, sinkronkan UI ke mode read-only
                    queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) })
                }
            } catch {
                // Heartbeat silent catch
            }
        }

        const startHeartbeat = () => {
            if (timerId) clearInterval(timerId)
            timerId = setInterval(triggerHeartbeat, HEARTBEAT_INTERVAL_MS)
        }

        const stopHeartbeat = () => {
            if (timerId) {
                clearInterval(timerId)
                timerId = null
            }
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Begitu tab kembali aktif, langsung kirim heartbeat dan aktifkan interval
                triggerHeartbeat()
                startHeartbeat()
            } else {
                // Hentikan heartbeat jika tab tidak visible / background
                stopHeartbeat()
            }
        }

        // Mulai heartbeat jika tab saat ini visible
        if (document.visibilityState === 'visible') {
            startHeartbeat()
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            stopHeartbeat()
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [
        selectedMatchId,
        userEmail,
        matchDetailQuery.data?.isReadOnly,
        matchDetailQuery.data?.match?.status,
        queryClient,
    ])

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

    // 7. Scoring Server Action Handlers (Beban Server Action dengan Loading State di Tombol, Tanpa Optimistic Prediction)
    const recordPoint = useCallback(
        (winningTeam: MatchTeam) => {
            if (!selectedMatchId || isPending) return
            // User/device dalam mode read-only tidak dapat mencatat poin
            if (matchDetailQuery.data?.isReadOnly) return

            setPendingTeam(winningTeam)
            startTransition(async () => {
                try {
                    const result = await recordPointAction(
                        selectedMatchId,
                        winningTeam,
                        userEmail || undefined
                    )

                    if (!result.success) {
                        toast.error(result.message)
                        await queryClient.invalidateQueries({
                            queryKey: matchDetailQueryKey(selectedMatchId),
                        })
                        return
                    }

                    // Feedback toast jika pertandingan selesai
                    if (result.data?.status === 'completed') {
                        toast.success('Pertandingan selesai!', result.message)
                    }

                    // Sinkronkan cache dengan data dari response server
                    if (result.data) {
                        queryClient.setQueryData(
                            matchDetailQueryKey(selectedMatchId, userEmail || undefined),
                            (old: unknown) => {
                                const oldData = old as MatchDetailData | undefined
                                if (!oldData) return oldData
                                return {
                                    ...oldData,
                                    match: result.data as Match,
                                    historyCount: (oldData.historyCount || 0) + 1,
                                    canUndo: true,
                                }
                            }
                        )
                    }

                    // Refresh query cache untuk memastikan konsistensi
                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) }),
                        queryClient.invalidateQueries({ queryKey: courtMatchesQueryKey(selectedCourtId) }),
                    ])
                } catch (err: unknown) {
                    const errorMsg = err instanceof Error ? err.message : 'Gagal mencatat poin.'
                    toast.error(errorMsg)
                    await queryClient.invalidateQueries({
                        queryKey: matchDetailQueryKey(selectedMatchId),
                    })
                } finally {
                    setPendingTeam(null)
                }
            })
        },
        [selectedMatchId, selectedCourtId, userEmail, matchDetailQuery.data?.isReadOnly, isPending, queryClient]
    )

    const undoPoint = useCallback(() => {
        if (!selectedMatchId || isPending) return

        startTransition(async () => {
            try {
                const result = await undoLastPointAction(selectedMatchId, userEmail || undefined)

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
    }, [selectedMatchId, selectedCourtId, userEmail, isPending, queryClient])

    const releaseControl = useCallback(async (): Promise<boolean> => {
        if (!selectedMatchId) return false
        if (matchDetailQuery.data?.isReadOnly) return false

        try {
            const result = await releaseScorerSessionAction(selectedMatchId, userEmail || undefined)
            if (result.success) {
                toast.info(result.message)
            } else {
                toast.error(result.message)
            }

            // Invalidate query cache agar status kepemilikan lock langsung ter-update
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) }),
                queryClient.invalidateQueries({ queryKey: courtMatchesQueryKey(selectedCourtId) }),
            ])

            return result.success
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Gagal melepas kendali scoring.'
            toast.error(errorMsg)
            return false
        }
    }, [selectedMatchId, selectedCourtId, userEmail, matchDetailQuery.data?.isReadOnly, queryClient])

    return {
        // Selection & Session state
        selectedCourtId,
        selectedMatchId,
        userEmail,
        servingTeam,
        isPending,
        pendingTeam,

        // Data
        courts: courtsQuery.data || [],
        isCourtsLoading: courtsQuery.isLoading,

        courtMatches: courtMatchesQuery.data?.matches || [],
        currentCourtMatch: courtMatchesQuery.data?.currentMatch || null,
        isMatchesLoading: courtMatchesQuery.isLoading,

        currentMatch,
        canUndo: Boolean(matchDetailQuery.data?.canUndo),
        isReadOnly: Boolean(matchDetailQuery.data?.isReadOnly),
        isClaimedByOther: Boolean(matchDetailQuery.data?.isClaimedByOther),
        historyCount: matchDetailQuery.data?.historyCount || 0,
        isMatchLoading: matchDetailQuery.isLoading,

        selectCourt,
        selectMatch,
        backToMatchList,
        toggleServe,
        recordPoint,
        undoPoint,
        releaseControl,
    }
}
