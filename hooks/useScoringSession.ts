'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCourtsQuery } from './useCourtsQuery'
import { useCourtMatchesQuery } from './useCourtMatchesQuery'
import { useMatchDetailQuery, matchDetailQueryKey } from './useMatchDetailQuery'
import { useRealtimeMatch } from './useRealtimeMatch'
import { claimScorerSessionAction, heartbeatScorerSessionAction } from '@/app/admin/(protected)/scoring/actions'
import { HEARTBEAT_INTERVAL_MS } from '@/lib/scoring'
import { toast } from '@/lib/toast'
import type { MatchTeam } from '@/lib/scoring'

interface UseScoringSessionOptions {
    initialCourtId?: string | null
    initialMatchId?: string | null
    initialUserEmail?: string | null
}

export function useScoringSession({
    initialCourtId,
    initialMatchId,
    initialUserEmail,
}: UseScoringSessionOptions = {}) {
    const queryClient = useQueryClient()

    // 1. Identitas User
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
                queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId!) })
            } catch (err) {
                console.error('Failed to claim session:', err)
            }
        }

        claimSession()

        return () => {
            isCancelled = true
        }
    }, [selectedMatchId, userEmail, queryClient])

    const isOwner = Boolean(
        selectedMatchId &&
        !matchDetailQuery.data?.isReadOnly &&
        userEmail &&
        matchDetailQuery.data?.match?.active_scorer_session_id?.toLowerCase().trim() === userEmail &&
        matchDetailQuery.data?.match?.status !== 'completed'
    )
    const isOwnerRef = useRef(isOwner)
    isOwnerRef.current = isOwner

    // 4b. Heartbeat berkala
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
                triggerHeartbeat()
                startHeartbeat()
            } else {
                stopHeartbeat()
            }
        }

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
        setInternalMatchId(null)
    }, [])

    const selectMatch = useCallback(
        (matchId: string) => {
            const matches = courtMatchesQuery.data?.matches || []
            const targetMatch = matches.find((m) => m.id === matchId)
            const currentLiveMatch = matches.find((m) => m.status === 'live')

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

    return {
        selectedCourtId,
        selectedMatchId,
        userEmail,
        servingTeam,
        courtsQuery,
        courtMatchesQuery,
        matchDetailQuery,
        currentMatch,
        selectCourt,
        selectMatch,
        backToMatchList,
        toggleServe,
    }
}
