'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Category, Team, Match } from '@/types/domain'
import { distributeTeamsToGroups } from '@/lib/draw'
import { useTournamentSettingsQuery } from './useTournamentSettingsQuery'

export const ACTIVE_CATEGORIES_QUERY_KEY = ['categories', 'active']
export const CATEGORY_DRAW_QUERY_KEY = ['draw', 'category']

export interface DrawnGroupDetail {
  id: string
  name: string
  teams: Team[]
}

export interface CategoryDrawData {
  confirmedTeams: Team[]
  groups: DrawnGroupDetail[]
  matches: Match[]
  hasExistingDraw: boolean
  hasStartedMatches: boolean
  previewGroupSizes: number[]
  teamPerGroup: number
}

/**
 * Hook untuk mengambil daftar kategori aktif
 */
export function useActiveCategoriesQuery() {
  const supabase = createClient()

  return useQuery<Category[]>({
    queryKey: ACTIVE_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      return (data as Category[]) || []
    },
  })
}

/**
 * Hook untuk mengambil detail drawing, tim confirmed, dan status match untuk kategori terpilih
 */
export function useCategoryDrawQuery(categoryId?: string) {
  const supabase = createClient()
  const { data: tournamentSettings } = useTournamentSettingsQuery()
  const teamPerGroup = tournamentSettings?.team_per_group ?? 4

  return useQuery<CategoryDrawData>({
    queryKey: [...CATEGORY_DRAW_QUERY_KEY, categoryId],
    queryFn: async () => {
      if (!categoryId) {
        return {
          confirmedTeams: [],
          groups: [],
          matches: [],
          hasExistingDraw: false,
          hasStartedMatches: false,
          previewGroupSizes: [],
          teamPerGroup,
        }
      }

      // 1. Ambil semua tim confirmed pada kategori ini
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('category_id', categoryId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true })

      if (teamsError) {
        throw new Error(teamsError.message)
      }

      const confirmedTeams = (teamsData as Team[]) || []
      const teamsMap = new Map<string, Team>(confirmedTeams.map((t) => [t.id, t]))

      // 2. Ambil grup pada kategori ini
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('category_id', categoryId)
        .order('name', { ascending: true })

      if (groupsError) {
        throw new Error(groupsError.message)
      }

      const groupsRaw = groupsData || []
      const groupIds = groupsRaw.map((g) => g.id)

      // 3. Ambil relasi group_teams
      let groupTeamsMap: Record<string, Team[]> = {}
      if (groupIds.length > 0) {
        const { data: groupTeamsData, error: groupTeamsError } = await supabase
          .from('group_teams')
          .select('group_id, team_id')
          .in('group_id', groupIds)

        if (groupTeamsError) {
          throw new Error(groupTeamsError.message)
        }

        // Kelompokkan tim berdasarkan group_id
        groupTeamsMap = (groupTeamsData || []).reduce(
          (acc, row) => {
            const team = teamsMap.get(row.team_id)
            if (team) {
              if (!acc[row.group_id]) acc[row.group_id] = []
              acc[row.group_id].push(team)
            }
            return acc
          },
          {} as Record<string, Team[]>
        )
      }

      const groups: DrawnGroupDetail[] = groupsRaw.map((g) => ({
        id: g.id,
        name: g.name,
        teams: groupTeamsMap[g.id] || [],
      }))

      // 4. Ambil matches pada kategori ini (round group)
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('category_id', categoryId)
        .eq('round', 'group')
        .order('created_at', { ascending: true })

      if (matchesError) {
        throw new Error(matchesError.message)
      }

      const matches: Match[] = (matchesData || []).map((m) => ({
        ...m,
        team_a: teamsMap.get(m.team_a_id) || null,
        team_b: teamsMap.get(m.team_b_id) || null,
      }))

      const hasExistingDraw = groups.length > 0
      const hasStartedMatches = matches.some(
        (m) => m.status === 'live' || m.status === 'completed'
      )
      const previewGroupSizes = distributeTeamsToGroups(
        confirmedTeams.length,
        teamPerGroup
      )

      return {
        confirmedTeams,
        groups,
        matches,
        hasExistingDraw,
        hasStartedMatches,
        previewGroupSizes,
        teamPerGroup,
      }
    },
    enabled: Boolean(categoryId),
  })
}
