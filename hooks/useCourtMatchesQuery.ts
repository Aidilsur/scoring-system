'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Match, Court } from '@/types/domain'

export const courtMatchesQueryKey = (courtId: string | null) => ['court_matches', courtId]

export interface CourtMatchesData {
    court: Court | null
    matches: Match[]
    currentMatch: Match | null
    liveMatch: Match | null
    scheduledMatches: Match[]
    completedMatches: Match[]
}

/**
 * Custom hook untuk mengambil pertandingan pada suatu court spesifik
 * Mengurutkan berdasarkan scheduled_time dan mengidentifikasi match aktif/terdekat
 */
export function useCourtMatchesQuery(courtId: string | null) {
    const supabase = createClient()

    return useQuery<CourtMatchesData>({
        queryKey: courtMatchesQueryKey(courtId),
        enabled: Boolean(courtId),
        queryFn: async () => {
            if (!courtId) {
                return {
                    court: null,
                    matches: [],
                    currentMatch: null,
                    liveMatch: null,
                    scheduledMatches: [],
                    completedMatches: [],
                }
            }

            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    team_a:teams!matches_team_a_id_fkey(id, player1_name, player2_name, status),
                    team_b:teams!matches_team_b_id_fkey(id, player1_name, player2_name, status),
                    category:categories(id, name, partner_type, level),
                    group:groups(id, name),
                    court:courts(id, name)
                `)
                .eq('court_id', courtId)
                .order('scheduled_time', { ascending: true, nullsFirst: false })

            if (error) {
                console.error('Fetch Court Matches Error:', error)
                throw new Error(error.message)
            }

            const rawMatches = (data as unknown as Match[]) || []

            // Ambil data court dari relasi match atau query langsung ke tabel courts jika belum ada match
            let court: Court | null = (rawMatches[0]?.court as Court) || null
            if (!court) {
                const { data: courtData } = await supabase
                    .from('courts')
                    .select('id, name')
                    .eq('id', courtId)
                    .maybeSingle()
                if (courtData) {
                    court = courtData as Court
                }
            }

            const liveMatch = rawMatches.find((m) => m.status === 'live') || null
            const scheduledMatches = rawMatches.filter((m) => m.status === 'scheduled')
            const completedMatches = rawMatches.filter((m) => m.status === 'completed')

            // Highlight match paling awal yang belum 'completed' (prioritaskan 'live', jika tidak ada maka first 'scheduled')
            const currentMatch = liveMatch || scheduledMatches[0] || null

            return {
                court,
                matches: rawMatches,
                currentMatch,
                liveMatch,
                scheduledMatches,
                completedMatches,
            }
        },
        refetchInterval: 10000, // Background refresh
    })
}
