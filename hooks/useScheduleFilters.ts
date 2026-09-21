'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCategoriesWithGroupsQuery } from './useScheduleQuery'
import { Category } from '@/types/domain'

export type ScheduleGenerationMode = 'step_by_step' | 'parallel'

interface UseScheduleFiltersOptions {
    initialCategoryId?: string
    scheduleMode?: ScheduleGenerationMode
}

export const SYNTHETIC_ALL_CATEGORY: Category = {
    id: 'ALL',
    name: 'Semua Kategori (Jadwal Gabungan Paralel)',
    partner_type: 'fix',
    level: 'bronze',
    is_active: true,
    created_at: '',
}

/**
 * useScheduleFilters
 * Mengelola state filter kategori, auto-select kategori pertama,
 * dan penentuan kategori aktif untuk modul jadwal pertandingan.
 * Mematuhi docs/component-architecture.md §K.
 */
export function useScheduleFilters({
    initialCategoryId,
    scheduleMode = 'step_by_step',
}: UseScheduleFiltersOptions = {}) {
    // 1. Kategori yang dipilih untuk mode bertahap (single category)
    const [singleCategoryId, setSingleCategoryId] = useState<string>(
        initialCategoryId && initialCategoryId !== 'ALL' ? initialCategoryId : ''
    )

    // 2. Query semua kategori yang sudah memiliki groups hasil draw
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        isError: isCategoriesError,
        error: categoriesError,
    } = useCategoriesWithGroupsQuery()

    // Auto-select kategori pertama saat categories berhasil dimuat
    useEffect(() => {
        if (!singleCategoryId && categories.length > 0) {
            setSingleCategoryId(categories[0].id)
        }
    }, [categories, singleCategoryId])

    // ID kategori aktif berdasarkan mode saat ini
    const isAllMode = scheduleMode === 'parallel'
    const selectedCategoryId = isAllMode ? 'ALL' : singleCategoryId

    const setSelectedCategoryId = useCallback((id: string) => {
        setSingleCategoryId(id)
    }, [])

    const selectedCategory = isAllMode
        ? SYNTHETIC_ALL_CATEGORY
        : categories.find((c) => c.id === singleCategoryId)

    return {
        categories,
        isLoadingCategories,
        isCategoriesError,
        categoriesError,
        singleCategoryId,
        setSingleCategoryId,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedCategory,
        isAllMode,
    }
}
