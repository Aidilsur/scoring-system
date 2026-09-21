'use client'

import {
    useKnockoutScheduleQuery,
    KnockoutRoundItem,
    KnockoutScheduleData,
} from './useKnockoutScheduleQuery'
import { useKnockoutScheduleMutations } from './useKnockoutScheduleMutations'

export type { KnockoutRoundItem, KnockoutScheduleData }

/**
 * useKnockoutSchedule
 * Thin composer hook untuk modul jadwal pertandingan babak knockout.
 * Meng-orchestrate useKnockoutScheduleQuery (data fetching & transformasi)
 * dan useKnockoutScheduleMutations (mutasi generate schedule otomatis).
 * Mematuhi docs/component-architecture.md §K.
 */
export function useKnockoutSchedule(initialCategoryId?: string) {
    const {
        categories,
        isLoadingCategories,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedCategory,
        knockoutData,
        isLoadingKnockout,
        isRefetchingKnockout,
        refetchKnockout,
    } = useKnockoutScheduleQuery({ initialCategoryId })

    const { generatingRound, isGeneratingKnockout, handleGenerateRound } =
        useKnockoutScheduleMutations({ selectedCategoryId })

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
