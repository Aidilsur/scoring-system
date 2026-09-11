'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Court } from '@/types/domain'

export const COURTS_QUERY_KEY = ['courts']

/**
 * Custom hook untuk mengambil daftar seluruh court turnamen
 */
export function useCourtsQuery() {
    const supabase = createClient()

    return useQuery<Court[]>({
        queryKey: COURTS_QUERY_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('courts')
                .select('id, tournament_id, name, created_at')
                .order('name', { ascending: true })

            if (error) {
                console.error('Fetch Courts Error:', error)
                throw new Error(error.message)
            }

            // Urutkan numerik jika nama mengandung angka (e.g. Court 1, Court 2, Court 10)
            const courts = (data as Court[]) || []
            return courts.sort((a, b) => {
                const numA = parseInt(a.name.match(/\d+/)?.[0] || '0', 10)
                const numB = parseInt(b.name.match(/\d+/)?.[0] || '0', 10)
                if (numA !== numB) return numA - numB
                return a.name.localeCompare(b.name)
            })
        },
        staleTime: 5 * 60 * 1000,
    })
}
