'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { sortGroupStandings } from '@/lib/scoring'
import type { Category, Group, Team, Match, GroupWithStandings, StandingRow } from '@/types/domain'

const categoryStandingsQueryKey = (categoryId: string | null) => [
    'category_standings',
    categoryId,
]

export interface CategoryStandingsData {
    category: Category | null
    groups: GroupWithStandings[]
    totalGroups: number
    totalTeams: number
    hasAnyTie: boolean
}

/**
 * Custom hook untuk mengambil data klasemen seluruh grup dalam suatu kategori turnamen.
 * Membaca langsung dari VIEW 'standings' di Supabase (tanpa hitung ulang manual),
 * diperkaya data tim dan diurutkan menggunakan aturan tie-breaker resmi §4.5.
 */
export function useCategoryStandingsQuery(categoryId: string | null) {
    const supabase = createClient()

    return useQuery<CategoryStandingsData>({
        queryKey: categoryStandingsQueryKey(categoryId),
        enabled: Boolean(categoryId),
        queryFn: async () => {
            if (!categoryId) {
                return {
                    category: null,
                    groups: [],
                    totalGroups: 0,
                    totalTeams: 0,
                    hasAnyTie: false,
                }
            }

            // 1. Fetch metadata kategori
            const { data: categoryData, error: categoryError } = await supabase
                .from('categories')
                .select('id, name, partner_type, level, is_active')
                .eq('id', categoryId)
                .single()

            if (categoryError || !categoryData) {
                console.error('Fetch Category Error:', categoryError)
                throw new Error(categoryError?.message || 'Kategori tidak ditemukan')
            }

            // 2. Fetch seluruh grup di kategori ini
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('id, name, category_id')
                .eq('category_id', categoryId)
                .order('name', { ascending: true })

            if (groupsError) {
                console.error('Fetch Groups Error:', groupsError)
                throw new Error(groupsError.message)
            }

            const groups = (groupsData as Group[]) || []
            const groupIds = groups.map((g) => g.id).filter(Boolean) as string[]

            if (groupIds.length === 0) {
                return {
                    category: categoryData as Category,
                    groups: [],
                    totalGroups: 0,
                    totalTeams: 0,
                    hasAnyTie: false,
                }
            }

            // 3. Fetch data dari VIEW 'standings' untuk seluruh grup terkait
            const { data: standingsRows, error: standingsError } = await supabase
                .from('standings')
                .select('*')
                .in('group_id', groupIds)

            if (standingsError) {
                console.error('Fetch Standings View Error:', standingsError)
                throw new Error(standingsError.message)
            }

            // 4. Fetch detail tim (pemain 1 & 2) di kategori ini
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('id, category_id, player1_name, player2_name, status')
                .eq('category_id', categoryId)

            if (teamsError) {
                console.error('Fetch Teams Error:', teamsError)
                throw new Error(teamsError.message)
            }

            const teamsMap: Record<string, Team> = {}
            for (const t of (teamsData as unknown as Team[]) || []) {
                teamsMap[t.id] = t
            }

            // 5. Fetch match completed (round group) untuk penentuan tie-breaker head-to-head
            const { data: matchesData } = await supabase
                .from('matches')
                .select('id, group_id, team_a_id, team_b_id, winner_team_id, status, round')
                .eq('category_id', categoryId)
                .eq('round', 'group')
                .eq('status', 'completed')

            const completedMatches = (matchesData as unknown as Match[]) || []

            // 6. Kelompokkan dan urutkan klasemen per-grup
            let hasAnyTie = false
            const processedGroups: GroupWithStandings[] = groups.map((grp) => {
                const grpId = grp.id!
                const rowsForGroup = ((standingsRows as unknown as StandingRow[]) || [])
                    .filter((r) => r.group_id === grpId)
                    .map((r) => ({
                        ...r,
                        played: r.played ?? 0,
                        won: r.won ?? 0,
                        drawn: r.drawn ?? 0,
                        lost: r.lost ?? 0,
                        games_for: r.games_for ?? 0,
                        games_against: r.games_against ?? 0,
                        game_diff: r.game_diff ?? 0,
                        points: r.points ?? 0,
                        team: teamsMap[r.team_id] || null,
                        group: grp,
                    }))

                const groupMatches = completedMatches.filter((m) => m.group_id === grpId)
                const { standings, hasTieRequiringManualDecision } = sortGroupStandings(
                    rowsForGroup,
                    groupMatches
                )

                if (hasTieRequiringManualDecision) {
                    hasAnyTie = true
                }

                return {
                    group: grp,
                    standings,
                    hasTieRequiringManualDecision,
                }
            })

            return {
                category: categoryData as Category,
                groups: processedGroups,
                totalGroups: groups.length,
                totalTeams: Object.keys(teamsMap).length,
                hasAnyTie,
            }
        },
        staleTime: 1000 * 5, // 5 detik
        refetchInterval: 10000, // Background poll 10 detik
    })
}
