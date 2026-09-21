'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateCategoryScheduleAction } from '@/app/admin/(protected)/schedule/actions'
import { toast } from '@/lib/toast'
import { KNOCKOUT_SCHEDULE_QUERY_KEY } from './useKnockoutScheduleQuery'

interface UseKnockoutScheduleMutationsOptions {
    selectedCategoryId: string
}

export function useKnockoutScheduleMutations({
    selectedCategoryId,
}: UseKnockoutScheduleMutationsOptions) {
    const queryClient = useQueryClient()

    // Mutation untuk generate jadwal babak knockout spesifik
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

    return {
        generatingRound,
        isGeneratingKnockout,
        handleGenerateRound,
    }
}
