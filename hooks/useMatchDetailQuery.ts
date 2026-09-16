'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Match } from '@/types/domain'
import { SESSION_LOCK_TTL_MS } from '@/lib/scoring'

export const matchDetailQueryKey = (matchId: string | null, userEmail?: string) =>
    userEmail ? ['match', matchId, userEmail.toLowerCase().trim()] : ['match', matchId]
export const matchHistoryCountQueryKey = (matchId: string | null) => ['match_history_count', matchId]

export interface MatchDetailData {
    match: Match | null
    historyCount: number
    canUndo: boolean
    isReadOnly: boolean
    isClaimedByOther: boolean
}

/**
 * Custom hook untuk mengambil detail match live scoring, status riwayat undo,
 * dan mengevaluasi status concurrency lock (read-only mode jika di-score akun wasit lain).
 */
export function useMatchDetailQuery(matchId: string | null, userEmail?: string) {
    const supabase = createClient()

    return useQuery<MatchDetailData>({
        queryKey: matchDetailQueryKey(matchId, userEmail),
        enabled: Boolean(matchId),
        queryFn: async () => {
            if (!matchId) {
                return {
                    match: null,
                    historyCount: 0,
                    canUndo: false,
                    isReadOnly: false,
                    isClaimedByOther: false,
                }
            }

            // 1. Ambil data match dengan relasi
            const { data: matchData, error: matchError } = await supabase
                .from('matches')
                .select(`
                    *,
                    team_a:teams!matches_team_a_id_fkey(id, player1_name, player2_name, status),
                    team_b:teams!matches_team_b_id_fkey(id, player1_name, player2_name, status),
                    category:categories(id, name, partner_type, level),
                    court:courts(id, name),
                    group:groups(id, name)
                `)
                .eq('id', matchId)
                .single()

            if (matchError || !matchData) {
                console.error('Fetch Match Detail Error:', matchError)
                throw new Error(matchError?.message || 'Pertandingan tidak ditemukan')
            }

            // 2. Ambil count riwayat skor untuk tombol undo
            const { count, error: historyError } = await supabase
                .from('match_score_history')
                .select('id', { count: 'exact', head: true })
                .eq('match_id', matchId)

            const historyCount = (!historyError && count) ? count : 0

            // 3. Evaluasi status lock concurrency berbasis identitas user email
            const rawMatch = matchData as unknown as Match
            const now = Date.now()
            const claimedAtTime = rawMatch.active_scorer_claimed_at
                ? new Date(rawMatch.active_scorer_claimed_at).getTime()
                : 0
            const isClaimExpired = !rawMatch.active_scorer_claimed_at || (now - claimedAtTime > SESSION_LOCK_TTL_MS)

            const currentUserEmail = userEmail?.toLowerCase().trim() || ''
            const activeScorerEmail = rawMatch.active_scorer_session_id?.toLowerCase().trim() || ''

            // Diklaim oleh orang lain jika active_scorer terisi, belum expired, dan BUKAN user yang sedang login
            const isClaimedByOther = Boolean(
                activeScorerEmail &&
                !isClaimExpired &&
                (!currentUserEmail || activeScorerEmail !== currentUserEmail)
            )

            return {
                match: rawMatch,
                historyCount,
                canUndo: historyCount > 0 && !isClaimedByOther,
                isReadOnly: isClaimedByOther,
                isClaimedByOther,
            }
        },
    })
}
