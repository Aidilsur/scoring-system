'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CategoryWithTeamCount } from '@/types/domain'

/**
 * Custom hook untuk query daftar kategori turnamen beserta jumlah tim terdaftar
 * Digunakan pada modul Admin Categories (/admin/categories)
 */
export function useAdminCategoriesQuery() {
    const supabase = createClient()

    return useQuery<CategoryWithTeamCount[]>({
        queryKey: ['admin-categories'],
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
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching admin categories:', error)
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
