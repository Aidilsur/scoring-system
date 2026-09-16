'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Team, Category } from '@/types/domain'

interface TeamsQueryFilters {
    status?: string
    categoryId?: string
}

/**
 * Custom hook untuk query daftar tim menggunakan TanStack Query
 */
export function useTeamsQuery(filters?: TeamsQueryFilters) {
    const supabase = createClient()

    return useQuery<Team[]>({
        queryKey: ['teams', filters?.status, filters?.categoryId],
        queryFn: async () => {
            let query = supabase
                .from('teams')
                .select(
                    `
                    id,
                    category_id,
                    player1_name,
                    player2_name,
                    phone_number,
                    instagram_handle,
                    reclub_handle,
                    payment_proof_url,
                    status,
                    created_at,
                    categories (
                        id,
                        name,
                        partner_type,
                        level
                    )
                `
                )
                .order('created_at', { ascending: false })

            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }

            if (filters?.categoryId && filters.categoryId !== 'all') {
                query = query.eq('category_id', filters.categoryId)
            }

            const { data, error } = await query

            if (error) {
                throw new Error(error.message)
            }

            // Normalisasi data relasi category jika dikembalikan sebagai single/array
            return (data || []).map((row: Record<string, unknown>) => ({
                ...row,
                categories: Array.isArray(row.categories)
                    ? row.categories[0]
                    : row.categories,
            })) as Team[]
        },
    })
}

/**
 * Custom hook untuk query daftar kategori turnamen
 */
export function useCategoriesQuery() {
    const supabase = createClient()

    return useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name, partner_type, level, is_active')
                .order('name', { ascending: true })

            if (error) {
                throw new Error(error.message)
            }

            return (data || []) as Category[]
        },
    })
}
