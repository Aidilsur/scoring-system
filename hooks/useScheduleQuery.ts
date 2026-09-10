'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Category, Match, Court, TournamentSettings } from '@/types/domain'

export const CATEGORIES_WITH_GROUPS_QUERY_KEY = ['categories', 'with-groups']
export const CATEGORY_SCHEDULE_QUERY_KEY = ['schedule', 'category']

export interface OccupiedCategorySlot {
    courtId: string
    courtName?: string
    scheduledTime: string
    categoryId: string
    categoryName?: string
}

export interface CategoryScheduleData {
    category?: Category
    matches: Match[]
    courts: Court[]
    tournamentSettings: TournamentSettings | null
    occupiedSlots: OccupiedCategorySlot[]
    totalMatches: number
    scheduledMatches: Match[]
    unscheduledMatches: Match[]
    hasExistingSchedule: boolean
    hasStartedMatches: boolean
    hasAnyStartedGroupMatches: boolean
    hasAnyScheduledGroupMatches: boolean
    allScheduled: boolean
}

/**
 * Mengekstrak format jam "HH:mm" dari timestamp atau string waktu.
 */
export function extractHHmm(timeStr?: string | null): string {
    if (!timeStr) return ''
    if (timeStr.includes('T')) {
        const timePart = timeStr.split('T')[1]
        return timePart ? timePart.slice(0, 5) : ''
    }
    if (timeStr.includes(':')) {
        return timeStr.slice(0, 5)
    }
    return timeStr
}

/**
 * Hook untuk mengambil kategori aktif yang sudah memiliki grup hasil drawing
 */
export function useCategoriesWithGroupsQuery() {
    const supabase = createClient()

    return useQuery<Category[]>({
        queryKey: CATEGORIES_WITH_GROUPS_QUERY_KEY,
        queryFn: async () => {
            // Mengambil semua kategori yang memiliki relasi grup di tabel groups (termasuk kategori nonaktif)
            const { data, error } = await supabase
                .from('categories')
                .select('*, groups!inner(id)')
                .order('name', { ascending: true })

            if (error) {
                // Fallback jika inner join gagal atau groups kosong
                console.warn('Categories with groups query error:', error.message)
                return []
            }

            // Deduplikasi kategori jika ada beberapa grup
            const uniqueCategoriesMap = new Map<string, Category>()
            for (const item of data || []) {
                if (!uniqueCategoriesMap.has(item.id)) {
                    uniqueCategoriesMap.set(item.id, {
                        id: item.id,
                        name: item.name,
                        partner_type: item.partner_type,
                        level: item.level,
                        is_active: item.is_active,
                        created_at: item.created_at,
                    })
                }
            }

            return Array.from(uniqueCategoriesMap.values())
        },
    })
}

/**
 * Hook untuk mengambil data jadwal, match, court, dan slot terisi untuk kategori terpilih
 */
export function useCategoryScheduleQuery(categoryId?: string) {
    const supabase = createClient()

    return useQuery<CategoryScheduleData>({
        queryKey: [...CATEGORY_SCHEDULE_QUERY_KEY, categoryId],
        enabled: Boolean(categoryId),
        queryFn: async () => {
            if (!categoryId) {
                throw new Error('Category ID wajib disediakan.')
            }

            const isAllMode = categoryId === 'ALL'

            // 1. Ambil detail kategori (jika bukan mode ALL)
            let categoryData: Category | undefined
            if (!isAllMode) {
                const { data, error: catError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('id', categoryId)
                    .single()

                if (catError) {
                    throw new Error(`Gagal memuat data kategori: ${catError.message}`)
                }
                categoryData = data as Category
            } else {
                categoryData = {
                    id: 'ALL',
                    name: 'Semua Kategori (Paralel)',
                    partner_type: 'fix',
                    level: 'bronze',
                    is_active: true,
                    created_at: new Date().toISOString(),
                }
            }

            // 2. Ambil tournament settings aktif
            const { data: settingsData } = await supabase
                .from('tournament_settings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            const tournamentSettings = (settingsData as TournamentSettings) || null

            // 3. Ambil daftar lapangan (courts)
            let courts: Court[] = []
            if (tournamentSettings?.id) {
                const { data: courtsData } = await supabase
                    .from('courts')
                    .select('*')
                    .eq('tournament_id', tournamentSettings.id)
                    .order('name', { ascending: true })

                courts = (courtsData as Court[]) || []
            }

            // 4. Ambil match round='group' (apakah untuk 1 kategori atau seluruh kategori aktif)
            let matchesQuery = supabase
                .from('matches')
                .select(`
                    *,
                    team_a:teams!matches_team_a_id_fkey(*),
                    team_b:teams!matches_team_b_id_fkey(*),
                    group:groups(*),
                    court:courts(*),
                    category:categories(*)
                `)
                .eq('round', 'group')

            if (!isAllMode) {
                matchesQuery = matchesQuery.eq('category_id', categoryId)
            }

            const { data: matchesData, error: matchesError } = await matchesQuery
                .order('scheduled_time', { ascending: true, nullsFirst: false })

            if (matchesError) {
                throw new Error(`Gagal memuat jadwal pertandingan: ${matchesError.message}`)
            }

            const matches = (matchesData as Match[]) || []

            // 5. Ambil slot terisi oleh kategori lain (hanya jika mode per-kategori)
            let occupiedSlots: OccupiedCategorySlot[] = []
            if (!isAllMode) {
                const { data: otherMatchesData } = await supabase
                    .from('matches')
                    .select(`
                        court_id,
                        scheduled_time,
                        category_id,
                        categories(name),
                        courts(name)
                    `)
                    .neq('category_id', categoryId)
                    .not('court_id', 'is', null)
                    .not('scheduled_time', 'is', null)

                occupiedSlots = (otherMatchesData || []).map((m: any) => ({
                    courtId: m.court_id,
                    courtName: m.courts?.name,
                    scheduledTime: extractHHmm(m.scheduled_time),
                    categoryId: m.category_id,
                    categoryName: m.categories?.name,
                }))
            }

            // 6. Hitung status global untuk seluruh match babak grup di semua kategori (untuk tombol reset)
            const { count: startedCount } = await supabase
                .from('matches')
                .select('id', { count: 'exact', head: true })
                .eq('round', 'group')
                .in('status', ['live', 'completed'])

            const hasAnyStartedGroupMatches = (startedCount || 0) > 0

            const { count: scheduledCount } = await supabase
                .from('matches')
                .select('id', { count: 'exact', head: true })
                .eq('round', 'group')
                .not('court_id', 'is', null)
                .not('scheduled_time', 'is', null)

            const hasAnyScheduledGroupMatches = (scheduledCount || 0) > 0

            // 7. Hitung metrik dan status
            const totalMatches = matches.length
            const scheduledMatches = matches.filter(
                (m) => m.court_id !== null && m.scheduled_time !== null
            )
            const unscheduledMatches = matches.filter(
                (m) => m.court_id === null || m.scheduled_time === null
            )
            const hasExistingSchedule = scheduledMatches.length > 0
            const hasStartedMatches = matches.some(
                (m) => m.status === 'live' || m.status === 'completed'
            )
            const allScheduled = totalMatches > 0 && unscheduledMatches.length === 0

            return {
                category: categoryData as Category,
                matches,
                courts,
                tournamentSettings,
                occupiedSlots,
                totalMatches,
                scheduledMatches,
                unscheduledMatches,
                hasExistingSchedule,
                hasStartedMatches,
                hasAnyStartedGroupMatches,
                hasAnyScheduledGroupMatches,
                allScheduled,
            }
        },
    })
}
