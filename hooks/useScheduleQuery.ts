'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Category, Match, Court, TournamentSettings, MatchRound } from '@/types/domain'
import {
    parseTimeToMinutes,
    formatMinutesToTime,
} from '@/lib/schedule/generateMatchSchedule'

const CATEGORIES_WITH_GROUPS_QUERY_KEY = ['categories', 'with-groups']
export const CATEGORY_SCHEDULE_QUERY_KEY = ['schedule', 'category']

interface SchedulableCategoryItem extends Category {
    categoryId: string
    round: MatchRound
    roundLabel: string
    displayLabel: string
}

export interface OccupiedCategorySlot {
    courtId: string
    courtName?: string
    scheduledTime: string
    categoryId: string
    categoryName?: string
}

interface KnockoutReservationInfo {
    reservedRounds: number
    activeCategoriesCount: number
    totalKnockoutMatches: number
    thirdPlaceEnabled: boolean
    reservedStartTime?: string
}

export interface CategoryScheduleData {
    category?: Category
    targetRound?: MatchRound
    matches: Match[]
    courts: Court[]
    tournamentSettings: TournamentSettings | null
    occupiedSlots: OccupiedCategorySlot[]
    knockoutReservation?: KnockoutReservationInfo
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
 * Hook untuk mengambil kategori & babak (fase grup, semifinal, final) yang dapat dijadwalkan
 */
export function useCategoriesWithGroupsQuery() {
    const supabase = createClient()

    return useQuery<SchedulableCategoryItem[]>({
        queryKey: CATEGORIES_WITH_GROUPS_QUERY_KEY,
        queryFn: async () => {
            // 1. Mengambil semua kategori yang memiliki relasi grup di tabel groups
            const { data, error } = await supabase
                .from('categories')
                .select('*, groups!inner(id)')
                .order('name', { ascending: true })

            if (error) {
                console.warn('Categories with groups query error:', error.message)
                return []
            }

            // Deduplikasi kategori
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

            const categories = Array.from(uniqueCategoriesMap.values())
            if (categories.length === 0) return []

            const schedulableItems: SchedulableCategoryItem[] = categories.map((cat) => {
                const partnerType = cat.partner_type.toUpperCase()
                const level = cat.level.toUpperCase()

                return {
                    id: cat.id,
                    categoryId: cat.id,
                    round: 'group' as MatchRound,
                    name: cat.name,
                    partner_type: cat.partner_type,
                    level: cat.level,
                    is_active: cat.is_active,
                    created_at: cat.created_at,
                    roundLabel: 'Fase Grup',
                    displayLabel: `${cat.name} (${partnerType} - ${level})`,
                }
            })

            return schedulableItems
        },
    })
}

/**
 * Hook untuk mengambil data jadwal, match, court, dan slot terisi untuk kategori terpilih
 */
export function useCategoryScheduleQuery(targetKey?: string) {
    const supabase = createClient()

    return useQuery<CategoryScheduleData>({
        queryKey: [...CATEGORY_SCHEDULE_QUERY_KEY, targetKey],
        enabled: Boolean(targetKey),
        queryFn: async () => {
            if (!targetKey) {
                throw new Error('Category ID wajib disediakan.')
            }

            const isAllMode = targetKey === 'ALL'
            let categoryId = targetKey
            let targetRound: MatchRound = 'group'

            if (!isAllMode && targetKey.includes(':')) {
                const parts = targetKey.split(':')
                categoryId = parts[0]
                targetRound = (parts[1] as MatchRound) || 'group'
            }

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

            // 4. Ambil match sesuai round dan kategori
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

            if (!isAllMode) {
                matchesQuery = matchesQuery
                    .eq('category_id', categoryId)
                    .eq('round', targetRound)
            } else {
                matchesQuery = matchesQuery.eq('round', 'group')
            }

            const { data: matchesData, error: matchesError } = await matchesQuery
                .order('scheduled_time', { ascending: true, nullsFirst: false })

            if (matchesError) {
                throw new Error(`Gagal memuat jadwal pertandingan: ${matchesError.message}`)
            }

            const matches = (matchesData as Match[]) || []

            // 5. Ambil slot terisi oleh match LAIN (hanya jika mode per-kategori)
            // Memperhitungkan SEMUA match (grup maupun knockout) dari SEMUA kategori
            // yang sudah punya court_id/scheduled_time
            let occupiedSlots: OccupiedCategorySlot[] = []
            if (!isAllMode) {
                const { data: otherMatchesData } = await supabase
                    .from('matches')
                    .select(`
                        court_id,
                        scheduled_time,
                        category_id,
                        round,
                        categories(name),
                        courts(name)
                    `)
                    .not('court_id', 'is', null)
                    .not('scheduled_time', 'is', null)

                occupiedSlots = (otherMatchesData || [])
                    .filter((m: any) => !(m.category_id === categoryId && m.round === targetRound))
                    .map((m: any) => ({
                        courtId: m.court_id,
                        courtName: m.courts?.name,
                        scheduledTime: extractHHmm(m.scheduled_time),
                        categoryId: m.category_id,
                        categoryName: m.categories?.name,
                    }))
            }

            // 6. Hitung status global untuk seluruh match babak grup di semua kategori
            // (untuk validasi tombol reset)
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

            // 7. Hitung estimasi reserved knockout rounds jika mode group atau ALL
            let knockoutReservation: KnockoutReservationInfo | undefined = undefined
            if (isAllMode || targetRound === 'group') {
                const { data: activeCatsWithGroups } = await supabase
                    .from('categories')
                    .select('id, is_active, groups!inner(id)')
                    .eq('is_active', true)

                const uniqueActiveCats = new Set<string>()
                for (const c of activeCatsWithGroups || []) {
                    uniqueActiveCats.add(c.id)
                }

                const activeCategoriesCount = uniqueActiveCats.size
                if (activeCategoriesCount > 0 && courts.length > 0 && tournamentSettings) {
                    const thirdPlaceEnabled = tournamentSettings.third_place_enabled ?? false
                    const knockoutMatchesPerCat = 2 + 1 + (thirdPlaceEnabled ? 1 : 0)
                    const totalKnockoutMatches = activeCategoriesCount * knockoutMatchesPerCat
                    const reservedRounds = Math.ceil(totalKnockoutMatches / courts.length)

                    let reservedStartTime: string | undefined = undefined
                    if (
                        tournamentSettings.daily_end_time &&
                        tournamentSettings.match_duration_minutes
                    ) {
                        const endMinutes = parseTimeToMinutes(tournamentSettings.daily_end_time)
                        const duration = tournamentSettings.match_duration_minutes
                        const startMinutes = endMinutes - reservedRounds * duration
                        if (startMinutes > 0) {
                            reservedStartTime = formatMinutesToTime(startMinutes)
                        }
                    }

                    knockoutReservation = {
                        reservedRounds,
                        activeCategoriesCount,
                        totalKnockoutMatches,
                        thirdPlaceEnabled,
                        reservedStartTime,
                    }
                }
            }

            // 8. Hitung metrik dan status untuk batch yang sedang aktif
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
                targetRound,
                matches,
                courts,
                tournamentSettings,
                occupiedSlots,
                knockoutReservation,
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
