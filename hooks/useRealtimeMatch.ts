'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { matchDetailQueryKey } from './useMatchDetailQuery'
import { courtMatchesQueryKey } from './useCourtMatchesQuery'

interface UseRealtimeMatchProps {
    matchId?: string | null
    courtId?: string | null
    allMatches?: boolean
    onMatchUpdate?: (newRecord: unknown) => void
}

/**
 * Hook Supabase Realtime untuk berlangganan perubahan tabel 'matches' secara instan.
 * Mendukung:
 * 1. Subscription per-match (matchId)
 * 2. Subscription per-court (courtId)
 * 3. Subscription seluruh matches (allMatches: true) untuk halaman overview multi-court /display/courts
 *
 * Memastikan tampilan wasit, TV court display, dan overview lobby selalu sinkron tanpa refresh.
 */
export function useRealtimeMatch({
    matchId,
    courtId,
    allMatches,
    onMatchUpdate,
}: UseRealtimeMatchProps) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!matchId && !courtId && !allMatches) return

        const supabase = createClient()
        let channelName = 'realtime-all-matches'
        if (matchId) {
            channelName = `realtime-match-${matchId}`
        } else if (courtId) {
            channelName = `realtime-court-${courtId}`
        }

        const channelConfig = allMatches
            ? {
                  event: '*' as const,
                  schema: 'public',
                  table: 'matches',
              }
            : {
                  event: '*' as const,
                  schema: 'public',
                  table: 'matches',
                  filter: matchId ? `id=eq.${matchId}` : `court_id=eq.${courtId}`,
              }

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                channelConfig,
                (payload) => {
                    // 1. Invalidate query cache yang relevan
                    if (allMatches) {
                        queryClient.invalidateQueries({ queryKey: ['courts_overview'] })
                        queryClient.invalidateQueries({ queryKey: ['courts'] })
                        queryClient.invalidateQueries({ queryKey: ['court_matches'] })
                    } else {
                        if (matchId) {
                            queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(matchId) })
                        }
                        if (courtId) {
                            queryClient.invalidateQueries({ queryKey: courtMatchesQueryKey(courtId) })
                        }
                    }

                    // 2. Callback opsional jika komponen memerlukan aksi langsung
                    if (onMatchUpdate && payload.new) {
                        onMatchUpdate(payload.new)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [matchId, courtId, allMatches, queryClient, onMatchUpdate])
}
