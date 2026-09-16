'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCategoriesWithGroupsQuery, extractHHmm, OccupiedCategorySlot } from './useScheduleQuery'
import { generateCategoryScheduleAction } from '@/app/admin/(protected)/schedule/actions'
import { Category, Match, Court, TournamentSettings } from '@/types/domain'
import { toast } from '@/lib/toast'

const KNOCKOUT_SCHEDULE_QUERY_KEY = ['schedule', 'knockout']

interface KnockoutRoundItem {
    round: 'semifinal' | 'third_place' | 'final'
    title: string
    description: string
    matches: Match[]
    exists: boolean
    isAllCompleted: boolean
    isScheduled: boolean
    hasStarted: boolean
    canGenerate: boolean
}

interface KnockoutScheduleData {
    category: Category | null
    settings: TournamentSettings | null
    courts: Court[]
    rounds: KnockoutRoundItem[]
    visibleRounds: KnockoutRoundItem[]
    allKnockoutCompleted: boolean
    scheduledMatches: Match[]
    occupiedSlots: OccupiedCategorySlot[]
}

export function useKnockoutSchedule(initialCategoryId?: string) {
    const queryClient = useQueryClient()
    const supabase = createClient()

    // 1. Ambil daftar kategori yang aktif dan sudah memiliki grup hasil undian
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
    } = useCategoriesWithGroupsQuery()

    // 2. Kategori yang sedang dipilih
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
        initialCategoryId || ''
    )

    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].categoryId || categories[0].id)
        }
    }, [categories, selectedCategoryId])

    // 3. Realtime subscription untuk update tabel matches pada kategori aktif
    useEffect(() => {
        if (!selectedCategoryId) return

        const channel = supabase
            .channel(`knockout-schedule-${selectedCategoryId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'matches',
                    filter: `category_id=eq.${selectedCategoryId}`,
                },
                () => {
                    queryClient.invalidateQueries({
                        queryKey: [...KNOCKOUT_SCHEDULE_QUERY_KEY, selectedCategoryId],
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedCategoryId, queryClient, supabase])

    // 4. Query data babak knockout untuk kategori terpilih
    const {
        data: knockoutData,
        isLoading: isLoadingKnockout,
        isRefetching: isRefetchingKnockout,
        refetch: refetchKnockout,
    } = useQuery<KnockoutScheduleData>({
        queryKey: [...KNOCKOUT_SCHEDULE_QUERY_KEY, selectedCategoryId],
        enabled: Boolean(selectedCategoryId),
        queryFn: async () => {
            if (!selectedCategoryId) {
                return {
                    category: null,
                    settings: null,
                    courts: [],
                    rounds: [],
                    visibleRounds: [],
                    allKnockoutCompleted: false,
                    scheduledMatches: [],
                    occupiedSlots: [],
                }
            }

            // a. Detail kategori
            const { data: categoryData } = await supabase
                .from('categories')
                .select('*')
                .eq('id', selectedCategoryId)
                .single()

            // b. Konfigurasi turnamen
            const { data: settingsData } = await supabase
                .from('tournament_settings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            const settings = (settingsData as TournamentSettings) || null

            // c. Lapangan (courts)
            let courts: Court[] = []
            if (settings?.id) {
                const { data: courtsData } = await supabase
                    .from('courts')
                    .select('*')
                    .eq('tournament_id', settings.id)
                    .order('name', { ascending: true })

                courts = (courtsData as Court[]) || []
            }

            // d. Ambil seluruh match knockout kategori ini
            const { data: knockoutMatchesData } = await supabase
                .from('matches')
                .select(`
                    *,
                    team_a:teams!matches_team_a_id_fkey(id, player1_name, player2_name, status),
                    team_b:teams!matches_team_b_id_fkey(id, player1_name, player2_name, status),
                    court:courts(id, name),
                    category:categories(id, name)
                `)
                .eq('category_id', selectedCategoryId)
                .in('round', ['semifinal', 'third_place', 'final'])
                .order('created_at', { ascending: true })

            const knockoutMatches = (knockoutMatchesData as unknown as Match[]) || []

            // e. Ambil SEMUA match (grup + knockout) seluruh kategori yang sudah terjadwal
            // (untuk occupied slots & grid)
            const { data: allScheduledData } = await supabase
                .from('matches')
                .select(`
                    *,
                    team_a:teams!matches_team_a_id_fkey(id, player1_name, player2_name, status),
                    team_b:teams!matches_team_b_id_fkey(id, player1_name, player2_name, status),
                    court:courts(id, name),
                    category:categories(id, name)
                `)
                .not('court_id', 'is', null)
                .not('scheduled_time', 'is', null)
                .order('scheduled_time', { ascending: true })

            const allScheduledMatches = (allScheduledData as unknown as Match[]) || []

            const occupiedSlots: OccupiedCategorySlot[] = allScheduledMatches
                .filter((m) => m.court_id && m.scheduled_time)
                .map((m) => ({
                    courtId: m.court_id!,
                    courtName: m.court?.name,
                    scheduledTime: extractHHmm(m.scheduled_time),
                    categoryId: m.category_id,
                    categoryName: m.category?.name,
                }))

            // f. Strukturkan status babak berurutan: Semifinal -> Juara 3 (opsional) -> Final
            const semiMatches = knockoutMatches.filter((m) => m.round === 'semifinal')
            const thirdMatches = knockoutMatches.filter((m) => m.round === 'third_place')
            const finalMatches = knockoutMatches.filter((m) => m.round === 'final')

            const thirdPlaceEnabled = Boolean(settings?.third_place_enabled)

            const roundConfigs: Array<{
                round: 'semifinal' | 'third_place' | 'final'
                title: string
                description: string
                matches: Match[]
                include: boolean
            }> = [
                {
                    round: 'semifinal',
                    title: 'Babak Semifinal',
                    description: '2 pertandingan perebutan tiket ke babak Final.',
                    matches: semiMatches,
                    include: true,
                },
                {
                    round: 'third_place',
                    title: 'Perebutan Juara 3',
                    description: 'Pertandingan antara tim yang kalah di babak Semifinal.',
                    matches: thirdMatches,
                    include: thirdPlaceEnabled || thirdMatches.length > 0,
                },
                {
                    round: 'final',
                    title: 'Babak Final',
                    description: 'Pertandingan penentuan gelar Juara 1 turnamen.',
                    matches: finalMatches,
                    include: true,
                },
            ]

            const allRounds: KnockoutRoundItem[] = []

            for (const cfg of roundConfigs) {
                if (!cfg.include) continue

                const exists = cfg.matches.length > 0
                const isAllCompleted =
                    exists && cfg.matches.every((m) => m.status === 'completed')
                const isScheduled =
                    exists && cfg.matches.every((m) => Boolean(m.court_id && m.scheduled_time))
                const hasStarted =
                    cfg.matches.some((m) => m.status === 'live' || m.status === 'completed')
                const canGenerate = exists && !isAllCompleted && !hasStarted

                allRounds.push({
                    round: cfg.round,
                    title: cfg.title,
                    description: cfg.description,
                    matches: cfg.matches,
                    exists,
                    isAllCompleted,
                    isScheduled,
                    hasStarted,
                    canGenerate,
                })
            }

            // Filter: SEMBUNYIKAN babak yang SEMUA match-nya sudah 'completed'
            const visibleRounds = allRounds.filter((r) => !r.isAllCompleted)

            const totalKnockoutMatches = knockoutMatches.length
            const allKnockoutCompleted =
                totalKnockoutMatches > 0 &&
                knockoutMatches.every((m) => m.status === 'completed')

            return {
                category: categoryData as Category,
                settings,
                courts,
                rounds: allRounds,
                visibleRounds,
                allKnockoutCompleted,
                scheduledMatches: allScheduledMatches,
                occupiedSlots,
            }
        },
    })

    // 5. Mutation untuk generate jadwal babak knockout spesifik
    const [generatingRound, setGeneratingRound] = useState<
        'semifinal' | 'third_place' | 'final' | null
    >(null)

    const { mutateAsync: runGenerateKnockout, isPending: isGeneratingKnockout } = useMutation({
        mutationFn: async (round: 'semifinal' | 'third_place' | 'final') => {
            if (!selectedCategoryId) throw new Error('Pilih kategori terlebih dahulu.')
            setGeneratingRound(round)
            return await generateCategoryScheduleAction(selectedCategoryId, round)
        },
        onSuccess: async (res) => {
            if (!res.success) {
                toast.error(res.message)
                return
            }

            if (res.unscheduledCount && res.unscheduledCount > 0) {
                toast.warning(
                    `${res.message} (${res.unscheduledCount} match tidak muat pada jam operasional hari ini).`
                )
            } else {
                toast.success(res.message)
            }

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: [...KNOCKOUT_SCHEDULE_QUERY_KEY, selectedCategoryId],
                }),
                queryClient.invalidateQueries({
                    queryKey: ['schedule'],
                }),
            ])
        },
        onError: (err: unknown) => {
            const errorMsg =
                err instanceof Error ? err.message : 'Gagal membuat jadwal babak knockout.'
            toast.error(errorMsg)
        },
        onSettled: () => {
            setGeneratingRound(null)
        },
    })

    const handleGenerateRound = useCallback(
        async (round: 'semifinal' | 'third_place' | 'final') => {
            try {
                await runGenerateKnockout(round)
            } catch (err) {
                console.error('Error generating knockout round:', err)
            }
        },
        [runGenerateKnockout]
    )

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

    return {
        categories,
        isLoadingCategories,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedCategory,
        knockoutData,
        isLoadingKnockout,
        isRefetchingKnockout,
        refetchKnockout,
        generatingRound,
        isGeneratingKnockout,
        handleGenerateRound,
    }
}
