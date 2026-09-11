'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { matchDetailQueryKey } from './useMatchDetailQuery'
import { courtMatchesQueryKey } from './useCourtMatchesQuery'

interface UseRealtimeMatchProps {
    matchId: string | null
    courtId?: string | null
    onMatchUpdate?: (newRecord: unknown) => void
}

/**
 * Hook Supabase Realtime untuk berlangganan perubahan tabel 'matches' secara instan.
 * Memastikan tampilan wasit di banyak device/tab selalu sinkron saat skor berubah.
 */
export function useRealtimeMatch({
    matchId,
    courtId,
    onMatchUpdate,
}: UseRealtimeMatchProps) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!matchId) return

        const supabase = createClient()
        const channelName = `realtime-match-${matchId}`

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'matches',
                    filter: `id=eq.${matchId}`,
                },
                (payload) => {
                    // 1. Invalidate query cache agar data relasi (teams, category) tetap utuh
                    queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(matchId) })
                    if (courtId) {
                        queryClient.invalidateQueries({ queryKey: courtMatchesQueryKey(courtId) })
                    }

                    // 2. Callback opsional jika komponen memerlukan aksi langsung
                    if (onMatchUpdate && payload.new) {
                        onMatchUpdate(payload.new)
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Realtime channel connected
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [matchId, courtId, queryClient, onMatchUpdate])
}
