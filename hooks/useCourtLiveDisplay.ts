'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useCourtMatchesQuery } from './useCourtMatchesQuery'
import { useRealtimeMatch } from './useRealtimeMatch'
import { shouldStartTiebreakGame, type MatchTeam } from '@/lib/scoring'
import type { Match, Court } from '@/types/domain'

export interface UseCourtLiveDisplayResult {
    court: Court | null
    match: Match | null
    nextMatch: Match | null
    status: 'live' | 'scheduled' | 'completed' | 'empty'
    servingTeam: MatchTeam
    isTiebreak: boolean
    currentTime: string
    isLoading: boolean
    autoAdvanceCountdown: number | null
    skipToNextMatch: () => void
}

const AUTO_ADVANCE_DELAY_SECONDS = 20

/**
 * Custom hook untuk TV Display Lapangan Padel (/display/court/[courtId]).
 * Menyediakan sinkronisasi Supabase Realtime,
 * pemilihan match otomatis (live -> scheduled -> completed),
 * rotasi servis, auto-advance countdown setelah match selesai, dan jam digital broadcast.
 */
export function useCourtLiveDisplay(courtId: string): UseCourtLiveDisplayResult {
    const courtMatchesQuery = useCourtMatchesQuery(courtId)

    // 1. Subscribe Supabase Realtime untuk semua perubahan match di court ini
    useRealtimeMatch({
        courtId,
    })

    // State untuk manual override atau auto-advance setelah match selesai
    const [viewingCompletedMatchId, setViewingCompletedMatchId] = useState<string | null>(null)
    const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null)
    const [currentTime, setCurrentTime] = useState<string>('')

    // 2. Jam Digital Broadcast Realtime (HH:mm:ss WIB)
    useEffect(() => {
        function updateClock() {
            const now = new Date()
            const timeStr = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            })
            setCurrentTime(`${timeStr} WIB`)
        }

        updateClock()
        const clockInterval = setInterval(updateClock, 1000)
        return () => clearInterval(clockInterval)
    }, [])

    const {
        court,
        liveMatch,
        scheduledMatches,
        completedMatches,
    } = useMemo(() => {
        const data = courtMatchesQuery.data
        return {
            court: data?.court || null,
            liveMatch: data?.liveMatch || null,
            scheduledMatches: data?.scheduledMatches || [],
            completedMatches: data?.completedMatches || [],
        }
    }, [courtMatchesQuery.data])

    // 3. Tentukan match mana yang ditampilkan di layar TV
    const activeMatch = useMemo<Match | null>(() => {
        // Prioritas 1: Match yang sedang live
        if (liveMatch) {
            return liveMatch
        }

        // Prioritas 2: Jika baru saja ada match yang selesai dan sedang dalam countdown auto-advance
        if (viewingCompletedMatchId) {
            const completed = completedMatches.find((m) => m.id === viewingCompletedMatchId)
            if (completed) return completed
        }

        // Prioritas 3: Match terjadwal berikutnya yang akan main
        if (scheduledMatches.length > 0) {
            return scheduledMatches[0]
        }

        // Prioritas 4: Jika tidak ada match live maupun scheduled, tapi ada match yang sudah selesai
        if (completedMatches.length > 0) {
            return completedMatches[completedMatches.length - 1]
        }

        return null
    }, [liveMatch, viewingCompletedMatchId, scheduledMatches, completedMatches])

    // Match berikutnya (preview)
    const nextMatch = useMemo<Match | null>(() => {
        if (!activeMatch) return null

        if (activeMatch.status === 'live' || activeMatch.status === 'completed') {
            return scheduledMatches.find((m) => m.id !== activeMatch.id) || null
        }

        if (activeMatch.status === 'scheduled') {
            return scheduledMatches.find((m) => m.id !== activeMatch.id) || null
        }

        return null
    }, [activeMatch, scheduledMatches])

    // 4. Deteksi otomatis saat match berubah menjadi 'completed' untuk memulai auto-advance timer
    useEffect(() => {
        if (!activeMatch || activeMatch.status !== 'completed') {
            setAutoAdvanceCountdown(null)
            return
        }

        // Jika match selesai dan masih ada match berikutnya yang terjadwal
        if (scheduledMatches.length > 0) {
            setAutoAdvanceCountdown(AUTO_ADVANCE_DELAY_SECONDS)

            const timer = setInterval(() => {
                setAutoAdvanceCountdown((prev) => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer)
                        setViewingCompletedMatchId(null) // Pindah otomatis ke scheduled match
                        return null
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [activeMatch?.id, activeMatch?.status, scheduledMatches.length])

    // Reset viewing completed jika ada match baru yang tiba-tiba menjadi live
    useEffect(() => {
        if (liveMatch) {
            setViewingCompletedMatchId(null)
            setAutoAdvanceCountdown(null)
        }
    }, [liveMatch])

    const skipToNextMatch = useCallback(() => {
        setAutoAdvanceCountdown(null)
        setViewingCompletedMatchId(null)
    }, [])

    // 5. Hitung giliran servis (deterministic tennis/padel serve rotation)
    const servingTeam = useMemo<MatchTeam>(() => {
        if (!activeMatch) return 'team_a'

        const isTiebreakActive = shouldStartTiebreakGame(
            activeMatch.games_team_a,
            activeMatch.games_team_b,
            activeMatch.round
        )

        if (isTiebreakActive) {
            const ptA = parseInt(activeMatch.current_point_a || '0', 10) || 0
            const ptB = parseInt(activeMatch.current_point_b || '0', 10) || 0
            const totalPoints = ptA + ptB
            // Pola rotasi tiebreak: Point 1 = Tim A, Point 2-3 = Tim B, Point 4-5 = Tim A, dst.
            const mod = totalPoints % 4
            return mod === 1 || mod === 2 ? 'team_b' : 'team_a'
        }

        // Rotasi game reguler: game genap (0-0, 1-1) serve Tim A, game ganjil (1-0, 2-1) serve Tim B
        const totalGames = (activeMatch.games_team_a || 0) + (activeMatch.games_team_b || 0)
        return totalGames % 2 === 0 ? 'team_a' : 'team_b'
    }, [activeMatch])

    const isTiebreak = Boolean(
        activeMatch &&
        shouldStartTiebreakGame(
            activeMatch.games_team_a,
            activeMatch.games_team_b,
            activeMatch.round
        )
    )

    const status: 'live' | 'scheduled' | 'completed' | 'empty' = useMemo(() => {
        if (!activeMatch) return 'empty'
        return activeMatch.status as 'live' | 'scheduled' | 'completed'
    }, [activeMatch])

    return {
        court,
        match: activeMatch,
        nextMatch,
        status,
        servingTeam,
        isTiebreak,
        currentTime,
        isLoading: courtMatchesQuery.isLoading,
        autoAdvanceCountdown,
        skipToNextMatch,
    }
}
