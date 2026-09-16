'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { sortGroupStandings } from '@/lib/scoring'
import { checkGroupStageComplete } from '@/lib/bracket'
import type { Category, Group, Team, Match, StandingRow } from '@/types/domain'

export const STANDINGS_OVERVIEW_QUERY_KEY = ['standings_overview']

export interface GroupLeaderPreview {
    groupId: string
    groupName: string
    team: {
        id: string
        player1_name: string
        player2_name: string
    } | null
    points: number
    won: number
    lost: number
    played: number
    hasMatches: boolean
}

export interface CategoryStandingsOverviewItem {
    category: Category
    groupCount: number
    teamCount: number
    totalGroupMatches: number
    completedGroupMatches: number
    isGroupStageComplete: boolean
    groupLeaders: GroupLeaderPreview[]
}

export interface StandingsOverviewData {
    categories: CategoryStandingsOverviewItem[]
    totalCategories: number
    totalGroups: number
    totalTeams: number
    totalMatches: number
    totalCompletedMatches: number
}

/**
 * Custom hook untuk mengambil ringkasan (overview) klasemen seluruh kategori aktif
 * yang sudah memiliki grup hasil drawing.
 * Digunakan pada halaman hub publik /display/standings.
 */
export function useStandingsOverviewQuery() {
    const supabase = createClient()

    return useQuery<StandingsOverviewData>({
        queryKey: STANDINGS_OVERVIEW_QUERY_KEY,
        queryFn: async () => {
            // 1. Ambil kategori aktif yang memiliki relasi ke grup
            const { data: categoriesData, error: catError } = await supabase
                .from('categories')
                .select('id, name, partner_type, level, is_active, created_at, groups!inner(id)')
                .eq('is_active', true)
                .order('name', { ascending: true })

            if (catError) {
                console.error('Error fetching categories with groups:', catError)
                throw new Error(catError.message)
            }

            const uniqueCatMap = new Map<string, Category>()
            for (const item of categoriesData || []) {
                if (!uniqueCatMap.has(item.id)) {
                    uniqueCatMap.set(item.id, {
                        id: item.id,
                        name: item.name,
                        partner_type: item.partner_type,
                        level: item.level,
                        is_active: item.is_active,
                        created_at: item.created_at,
                    })
                }
            }

            const categories = Array.from(uniqueCatMap.values())
            if (categories.length === 0) {
                return {
                    categories: [],
                    totalCategories: 0,
                    totalGroups: 0,
                    totalTeams: 0,
                    totalMatches: 0,
                    totalCompletedMatches: 0,
                }
            }

            const categoryIds = categories.map((c) => c.id)

            // 2. Ambil grup untuk seluruh kategori ini
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('id, name, category_id')
                .in('category_id', categoryIds)
                .order('name', { ascending: true })

            if (groupsError) {
                console.error('Error fetching groups:', groupsError)
                throw new Error(groupsError.message)
            }

            const groups = (groupsData as Group[]) || []
            const allGroupIds = groups.map((g) => g.id).filter(Boolean) as string[]

            // 3. Ambil data tim yang terdaftar di kategori-kategori ini
            const { data: teamsData, error: teamsError } = await supabase
                .from('teams')
                .select('id, category_id, player1_name, player2_name, status')
                .in('category_id', categoryIds)

            if (teamsError) {
                console.error('Error fetching teams:', teamsError)
                throw new Error(teamsError.message)
            }

            const teams = (teamsData as unknown as Team[]) || []
            const teamsMap: Record<string, Team> = {}
            for (const t of teams) {
                teamsMap[t.id] = t
            }

            // 4. Ambil penugasan grup-tim
            let groupTeams: { group_id: string; team_id: string }[] = []
            if (allGroupIds.length > 0) {
                const { data: gtData } = await supabase
                    .from('group_teams')
                    .select('group_id, team_id')
                    .in('group_id', allGroupIds)
                groupTeams = gtData || []
            }

            // 5. Ambil data VIEW standings
            let standingsRows: StandingRow[] = []
            if (allGroupIds.length > 0) {
                const { data: standingsData } = await supabase
                    .from('standings')
                    .select('*')
                    .in('group_id', allGroupIds)
                standingsRows = (standingsData as unknown as StandingRow[]) || []
            }

            // 6. Ambil match babak grup
            const { data: matchesData } = await supabase
                .from('matches')
                .select('id, category_id, group_id, team_a_id, team_b_id, winner_team_id, status, round')
                .in('category_id', categoryIds)
                .eq('round', 'group')

            const allGroupMatches = (matchesData as unknown as Match[]) || []

            let totalCompletedMatchesCount = 0

            // 7. Konstruksi data per kategori
            const categoryItems: CategoryStandingsOverviewItem[] = categories.map((category) => {
                const catGroups = groups.filter((g) => g.category_id === category.id)
                const catGroupIds = catGroups.map((g) => g.id)

                // Hitung tim yang tergabung dalam grup kategori ini
                const catGroupTeamIds = new Set(
                    groupTeams
                        .filter((gt) => catGroupIds.includes(gt.group_id))
                        .map((gt) => gt.team_id)
                )
                // Jika belum ada di group_teams, fallback ke tim confirmed kategori
                const teamCount =
                    catGroupTeamIds.size > 0
                        ? catGroupTeamIds.size
                        : teams.filter((t) => t.category_id === category.id && t.status === 'confirmed').length

                const catMatches = allGroupMatches.filter((m) => m.category_id === category.id)
                const totalGroupMatches = catMatches.length
                const completedGroupMatches = catMatches.filter((m) => m.status === 'completed').length
                totalCompletedMatchesCount += completedGroupMatches
                const isGroupStageComplete = checkGroupStageComplete(catMatches)

                // Hitung preview pemimpin/juara sementara tiap grup
                const groupLeaders: GroupLeaderPreview[] = catGroups.map((grp) => {
                    const grpId = grp.id!
                    const rowsForGroup: StandingRow[] = standingsRows
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

                    // Sisipkan tim yang ada di group_teams namun belum punya skor di standings view
                    const assignedGt = groupTeams.filter((gt) => gt.group_id === grpId)
                    for (const gt of assignedGt) {
                        if (!rowsForGroup.some((r) => r.team_id === gt.team_id)) {
                            rowsForGroup.push({
                                group_id: grpId,
                                team_id: gt.team_id,
                                played: 0,
                                won: 0,
                                drawn: 0,
                                lost: 0,
                                games_for: 0,
                                games_against: 0,
                                game_diff: 0,
                                points: 0,
                                team: teamsMap[gt.team_id] || null,
                                group: grp,
                            })
                        }
                    }

                    const compMatches = catMatches.filter(
                        (m) => m.group_id === grpId && m.status === 'completed'
                    )
                    const { standings: sortedGroup } = sortGroupStandings(
                        rowsForGroup,
                        compMatches
                    )

                    const leader = sortedGroup[0]
                    const hasMatches = Boolean(leader && leader.played > 0)

                    return {
                        groupId: grpId,
                        groupName: grp.name,
                        team: leader?.team
                            ? {
                                  id: leader.team.id,
                                  player1_name: leader.team.player1_name,
                                  player2_name: leader.team.player2_name,
                              }
                            : null,
                        points: leader?.points ?? 0,
                        won: leader?.won ?? 0,
                        lost: leader?.lost ?? 0,
                        played: leader?.played ?? 0,
                        hasMatches,
                    }
                })

                return {
                    category,
                    groupCount: catGroups.length,
                    teamCount,
                    totalGroupMatches,
                    completedGroupMatches,
                    isGroupStageComplete,
                    groupLeaders,
                }
            })

            return {
                categories: categoryItems,
                totalCategories: categoryItems.length,
                totalGroups: groups.length,
                totalTeams: teams.filter((t) => t.status === 'confirmed').length,
                totalMatches: allGroupMatches.length,
                totalCompletedMatches: totalCompletedMatchesCount,
            }
        },
        staleTime: 1000 * 5,
        refetchInterval: 10000,
    })
}
