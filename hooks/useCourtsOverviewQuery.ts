'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Match, Court } from '@/types/domain'

export const COURTS_OVERVIEW_QUERY_KEY = ['courts_overview']

export interface CourtOverviewItem {
    court: Court
    status: 'live' | 'scheduled' | 'completed' | 'empty'
    liveMatch: Match | null
    nextScheduledMatch: Match | null
    lastCompletedMatch: Match | null
    totalMatches: number
    completedCount: number
    allMatches: Match[]
}

export interface CourtsOverviewData {
    courts: CourtOverviewItem[]
    totalCourts: number
    activeLiveCourtsCount: number
    totalLiveMatchesCount: number
    totalScheduledMatchesCount: number
}

/**
 * Custom hook untuk mengambil ringkasan seluruh lapangan (courts) beserta
 * status pertandingan aktif (live), antrean jadwal berikutnya, dan progres pertandingan.
 * Digunakan pada halaman lobby/overview publik /display/courts.
 */
export function useCourtsOverviewQuery() {
    const supabase = createClient()

    return useQuery<CourtsOverviewData>({
        queryKey: COURTS_OVERVIEW_QUERY_KEY,
        queryFn: async () => {
            // 1. Fetch seluruh lapangan yang terdaftar
            const { data: courtsData, error: courtsError } = await supabase
                .from('courts')
                .select('id, tournament_id, name, created_at')
                .order('name', { ascending: true })

            if (courtsError) {
                console.error('Fetch Courts Error in Overview:', courtsError)
                throw new Error(courtsError.message)
            }

            const rawCourts = (courtsData as Court[]) || []

            // Urutkan nama court secara natural (e.g. Court 1, Court 2, Court 10)
            const sortedCourts = [...rawCourts].sort((a, b) => {
                const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10)
                const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10)
                if (numA !== numB) return numA - numB
                return a.name.localeCompare(b.name)
            })

            // 2. Fetch seluruh pertandingan beserta relasi tim, kategori, dan grup
            const { data: matchesData, error: matchesError } = await supabase
                .from('matches')
                .select(`
                    *,
                    team_a:teams!matches_team_a_id_fkey(id, player1_name, player2_name, status),
                    team_b:teams!matches_team_b_id_fkey(id, player1_name, player2_name, status),
                    category:categories(id, name, partner_type, level),
                    group:groups(id, name),
                    court:courts(id, name)
                `)
                .order('scheduled_time', { ascending: true, nullsFirst: false })

            if (matchesError) {
                console.error('Fetch Matches Error in Overview:', matchesError)
                throw new Error(matchesError.message)
            }

            const allMatches = (matchesData as unknown as Match[]) || []

            // 3. Kelompokkan per-court
            let activeLiveCourtsCount = 0
            let totalLiveMatchesCount = 0
            let totalScheduledMatchesCount = 0

            const courtsOverview: CourtOverviewItem[] = sortedCourts.map((court) => {
                const courtMatches = allMatches.filter((m) => m.court_id === court.id)
                const liveMatch = courtMatches.find((m) => m.status === 'live') || null
                const nextScheduledMatch = courtMatches.find((m) => m.status === 'scheduled') || null
                const completedMatches = courtMatches.filter((m) => m.status === 'completed')
                const lastCompletedMatch = completedMatches[completedMatches.length - 1] || null

                if (liveMatch) {
                    activeLiveCourtsCount++
                    totalLiveMatchesCount++
                }
                if (nextScheduledMatch) {
                    totalScheduledMatchesCount++
                }

                let status: 'live' | 'scheduled' | 'completed' | 'empty' = 'empty'
                if (liveMatch) {
                    status = 'live'
                } else if (nextScheduledMatch) {
                    status = 'scheduled'
                } else if (completedMatches.length > 0) {
                    status = 'completed'
                }

                return {
                    court,
                    status,
                    liveMatch,
                    nextScheduledMatch,
                    lastCompletedMatch,
                    totalMatches: courtMatches.length,
                    completedCount: completedMatches.length,
                    allMatches: courtMatches,
                }
            })

            return {
                courts: courtsOverview,
                totalCourts: sortedCourts.length,
                activeLiveCourtsCount,
                totalLiveMatchesCount,
                totalScheduledMatchesCount,
            }
        },
        staleTime: 1000 * 5, // 5 detik
        refetchInterval: 10000, // Background poll 10 detik
    })
}
