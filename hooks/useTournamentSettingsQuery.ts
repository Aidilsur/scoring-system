'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { TournamentSettings } from '@/types/domain'

export const TOURNAMENT_SETTINGS_QUERY_KEY = ['tournament_settings']

/**
 * Custom hook untuk mengambil data pengaturan turnamen aktif via TanStack Query.
 */
export function useTournamentSettingsQuery(initialData?: TournamentSettings | null) {
    const supabase = createClient()

    return useQuery<TournamentSettings | null>({
        queryKey: TOURNAMENT_SETTINGS_QUERY_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tournament_settings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (error) {
                throw new Error(error.message)
            }

            return (data as TournamentSettings) || null
        },
        initialData: initialData ?? undefined,
    })
}
