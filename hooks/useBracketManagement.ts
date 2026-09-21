'use client'

import { useState, useEffect } from 'react'
import {
    useCategoriesWithGroupsQuery,
    useCategoryBracketQuery,
} from './useBracketQuery'
import { useBracketMutations } from './useBracketMutations'

/**
 * useBracketManagement (Thin Composer)
 * Menggabungkan state kategori, query data bracket, dan useBracketMutations.
 * Sesuai docs/component-architecture.md §E dan §K.
 */
export function useBracketManagement(initialCategoryId?: string) {
    // 1. State Kategori Terpilih
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
        initialCategoryId || ''
    )

    // 2. Query Kategori yang Memiliki Grup
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
    } = useCategoriesWithGroupsQuery()

    // Otomatis pilih kategori pertama jika belum ada yang dipilih
    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].id)
        }
    }, [categories, selectedCategoryId])

    // 3. Query Data Bracket
    const {
        data: bracketData,
        isLoading: isLoadingBracket,
        isRefetching: isRefetchingBracket,
        refetch: refetchBracket,
    } = useCategoryBracketQuery(selectedCategoryId)

    // 4. Bracket Mutations
    const {
        handleGenerateBracket,
        handleResetBracket,
        handleGenerateFinal,
        handleResetFinal,
        isGenerating,
        isResetting,
        isGeneratingFinal,
        isResettingFinal,
    } = useBracketMutations({ selectedCategoryId })

    return {
        categories,
        isLoadingCategories,
        selectedCategoryId,
        setSelectedCategoryId,
        bracketData,
        isLoadingBracket,
        isRefetchingBracket,
        refetchBracket,
        handleGenerateBracket,
        handleResetBracket,
        handleGenerateFinal,
        handleResetFinal,
        isGenerating,
        isResetting,
        isGeneratingFinal,
        isResettingFinal,
    }
}
