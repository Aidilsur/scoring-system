'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Category, Match, Group } from '@/types/domain'
import { checkGroupStageComplete, checkSemifinalComplete } from '@/lib/bracket'

export const BRACKET_CATEGORIES_QUERY_KEY = ['bracket', 'categories-with-groups']
export const CATEGORY_BRACKET_QUERY_KEY = ['bracket', 'category']

export type SemifinalMatchWithTeams = Match

export interface CategoryBracketData {
    category: Category | null
    groups: Group[]
    groupCount: number
    isTwoGroups: boolean
    groupMatches: Match[]
    totalGroupMatches: number
    remainingGroupMatches: number
    completedGroupMatches: number
    isGroupStageComplete: boolean
    semifinalMatches: SemifinalMatchWithTeams[]
    hasExistingBracket: boolean
    hasStartedSemifinals: boolean
    isSemifinalComplete: boolean
    finalMatch: SemifinalMatchWithTeams | null
    thirdPlaceMatch: SemifinalMatchWithTeams | null
    hasExistingFinal: boolean
    hasStartedFinalStage: boolean
    thirdPlaceEnabled: boolean
}

/**
 * Hook untuk mengambil kategori yang sudah memiliki grup hasil drawing
 */
export function useCategoriesWithGroupsQuery() {
    const supabase = createClient()

    return useQuery<Category[]>({
        queryKey: BRACKET_CATEGORIES_QUERY_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*, groups!inner(id)')
                .order('name', { ascending: true })

            if (error) {
                console.warn('Gagal memuat kategori dengan grup:', error.message)
                return []
            }

            const uniqueMap = new Map<string, Category>()
            for (const item of data || []) {
                if (!uniqueMap.has(item.id)) {
                    uniqueMap.set(item.id, {
                        id: item.id,
                        name: item.name,
                        partner_type: item.partner_type,
                        level: item.level,
                        is_active: item.is_active,
                        created_at: item.created_at,
                    })
                }
            }

            return Array.from(uniqueMap.values())
        },
    })
}

/**
 * Hook untuk memuat data bracket semifinal, grup, dan status fase grup untuk kategori terpilih
 */
export function useCategoryBracketQuery(categoryId?: string) {
    const supabase = createClient()
    const queryClient = useQueryClient()

    // Realtime subscription untuk mendengarkan update pada tabel matches
    useEffect(() => {
        if (!categoryId) return

        const channel = supabase
            .channel(`bracket-matches-${categoryId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                    filter: `category_id=eq.${categoryId}`,
                },
                () => {
                    queryClient.invalidateQueries({
                        queryKey: [...CATEGORY_BRACKET_QUERY_KEY, categoryId],
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [categoryId, supabase, queryClient])

    return useQuery<CategoryBracketData>({
        queryKey: [...CATEGORY_BRACKET_QUERY_KEY, categoryId],
        enabled: Boolean(categoryId),
        queryFn: async () => {
            if (!categoryId) {
                return {
                    category: null,
                    groups: [],
                    groupCount: 0,
                    isTwoGroups: false,
                    groupMatches: [],
                    totalGroupMatches: 0,
                    remainingGroupMatches: 0,
                    completedGroupMatches: 0,
                    isGroupStageComplete: false,
                    semifinalMatches: [],
                    hasExistingBracket: false,
                    hasStartedSemifinals: false,
                    isSemifinalComplete: false,
                    finalMatch: null,
                    thirdPlaceMatch: null,
                    hasExistingFinal: false,
                    hasStartedFinalStage: false,
                    thirdPlaceEnabled: false,
                }
            }

            // 1. Ambil detail kategori
            const { data: categoryData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('id', categoryId)
                .single()

            if (catError) {
                throw new Error(`Gagal memuat kategori: ${catError.message}`)
            }

            // 2. Ambil grup dalam kategori ini
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('id, name, category_id, created_at')
                .eq('category_id', categoryId)
                .order('name', { ascending: true })

            if (groupsError) {
                throw new Error(`Gagal memuat grup: ${groupsError.message}`)
            }

            const groups = (groupsData as Group[]) || []
            const groupCount = groups.length
            const isTwoGroups = groupCount === 2

            // 3. Ambil semua match babak grup
            const { data: groupMatchesData, error: groupMatchesError } = await supabase
                .from('matches')
                .select('*')
                .eq('category_id', categoryId)
                .eq('round', 'group')
                .order('created_at', { ascending: true })

            if (groupMatchesError) {
                throw new Error(`Gagal memuat match grup: ${groupMatchesError.message}`)
            }

            const groupMatches = (groupMatchesData as Match[]) || []
            const isGroupStageComplete = checkGroupStageComplete(groupMatches)
            const totalGroupMatches = groupMatches.length
            const remainingGroupMatches = groupMatches.filter(
                (m) => m.status !== 'completed'
            ).length
            const completedGroupMatches = groupMatches.filter(
                (m) => m.status === 'completed'
            ).length

            // 4. Ambil semua match semifinal
            const { data: semifinalMatchesData, error: semiError } = await supabase
                .from('matches')
                .select(`
                    *,
                    team_a:teams!matches_team_a_id_fkey(id, player1_name, player2_name, status),
                    team_b:teams!matches_team_b_id_fkey(id, player1_name, player2_name, status),
                    court:courts(id, name)
                `)
                .eq('category_id', categoryId)
                .eq('round', 'semifinal')
                .order('created_at', { ascending: true })

            if (semiError) {
                throw new Error(`Gagal memuat match semifinal: ${semiError.message}`)
            }

            const semifinalMatches = (semifinalMatchesData as unknown as SemifinalMatchWithTeams[]) || []
            const hasExistingBracket = semifinalMatches.length > 0
            const hasStartedSemifinals = semifinalMatches.some(
                (m) => m.status === 'live' || m.status === 'completed'
            )
            const isSemifinalComplete = checkSemifinalComplete(semifinalMatches)

            // 5. Ambil match babak final dan perebutan juara 3
            const { data: finalStageMatchesData, error: finalStageError } = await supabase
                .from('matches')
                .select(`
                    *,
                    team_a:teams!matches_team_a_id_fkey(id, player1_name, player2_name, status),
                    team_b:teams!matches_team_b_id_fkey(id, player1_name, player2_name, status),
                    court:courts(id, name)
                `)
                .eq('category_id', categoryId)
                .in('round', ['final', 'third_place'])
                .order('created_at', { ascending: true })

            if (finalStageError) {
                throw new Error(`Gagal memuat match final: ${finalStageError.message}`)
            }

            const finalStageMatches = (finalStageMatchesData as unknown as SemifinalMatchWithTeams[]) || []
            const finalMatch = finalStageMatches.find((m) => m.round === 'final') || null
            const thirdPlaceMatch = finalStageMatches.find((m) => m.round === 'third_place') || null
            const hasExistingFinal = finalMatch !== null
            const hasStartedFinalStage = finalStageMatches.some(
                (m) => m.status === 'live' || m.status === 'completed'
            )

            // 6. Ambil konfigurasi third_place_enabled
            const { data: settingsData } = await supabase
                .from('tournament_settings')
                .select('third_place_enabled')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            const thirdPlaceEnabled = settingsData?.third_place_enabled ?? false

            return {
                category: categoryData as Category,
                groups,
                groupCount,
                isTwoGroups,
                groupMatches,
                totalGroupMatches,
                remainingGroupMatches,
                completedGroupMatches,
                isGroupStageComplete,
                semifinalMatches,
                hasExistingBracket,
                hasStartedSemifinals,
                isSemifinalComplete,
                finalMatch,
                thirdPlaceMatch,
                hasExistingFinal,
                hasStartedFinalStage,
                thirdPlaceEnabled,
            }
        },
    })
}
