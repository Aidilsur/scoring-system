'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CategoryWithTeamCount } from '@/types/domain'

export const PUBLIC_CATEGORIES_QUERY_KEY = ['public-categories']

/**
 * Custom hook untuk query daftar kategori turnamen yang AKTIF (is_active = true)
 * Digunakan pada halaman publik (homepage).
 * Tidak me-reuse hook admin karena hanya menampilkan data yang boleh dilihat publik.
 */
export function usePublicCategoriesQuery() {
    const supabase = createClient()

    return useQuery<CategoryWithTeamCount[]>({
        queryKey: PUBLIC_CATEGORIES_QUERY_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select(`
                    id,
                    name,
                    partner_type,
                    level,
                    is_active,
                    created_at,
                    teams (count)
                `)
                .eq('is_active', true)
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching public categories:', error)
                throw new Error(error.message)
            }

            return (data || []).map((row: Record<string, unknown>) => {
                const teamsData = row.teams as Array<{ count?: number }> | undefined
                const count = teamsData && teamsData.length > 0 ? Number(teamsData[0].count || 0) : 0

                return {
                    id: String(row.id),
                    name: String(row.name),
                    partner_type: String(row.partner_type),
                    level: String(row.level),
                    is_active: Boolean(row.is_active),
                    created_at: row.created_at ? String(row.created_at) : undefined,
                    team_count: count,
                }
            })
        },
    })
}
