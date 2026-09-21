'use client'

import { useCallback } from 'react'
import { useCategoryScheduleQuery } from './useScheduleQuery'
import {
    useScheduleFilters,
    ScheduleGenerationMode,
} from './useScheduleFilters'
import {
    useScheduleGenerationForm,
    UnscheduledWarningInfo,
} from './useScheduleGenerationForm'
import {
    useScheduleMutations,
    ScheduleToast,
} from './useScheduleMutations'

export type { ScheduleGenerationMode, ScheduleToast, UnscheduledWarningInfo }

/**
 * useScheduleManagement
 * Thin composer hook yang meng-orchestrate:
 * 1. Form state parameter penjadwalan & warning (useScheduleGenerationForm)
 * 2. Filter & navigasi kategori (useScheduleFilters)
 * 3. Query data jadwal pertandingan (useCategoryScheduleQuery)
 * 4. Mutasi generate & reset jadwal (useScheduleMutations)
 *
 * Mematuhi docs/component-architecture.md §K.
 */
export function useScheduleManagement(initialCategoryId?: string) {
    // 1. Generation form state (mode, modal, warning)
    const {
        scheduleMode,
        setScheduleModeState,
        unscheduledWarning,
        setUnscheduledWarning,
        clearUnscheduledWarning,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        confirmModalMode,
        setConfirmModalMode,
    } = useScheduleGenerationForm()

    // 2. Filters & category navigation
    const {
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
    } = useScheduleFilters({ initialCategoryId, scheduleMode })

    // Wire handler setScheduleMode dengan auto-select kategori pertama
    const setScheduleMode = useCallback(
        (mode: ScheduleGenerationMode) => {
            setScheduleModeState(mode)
            if (
                mode === 'step_by_step' &&
                !singleCategoryId &&
                categories.length > 0
            ) {
                setSingleCategoryId(categories[0].id)
            }
        },
        [categories, singleCategoryId, setSingleCategoryId, setScheduleModeState]
    )

    // 3. Query data jadwal untuk kategori terpilih (atau 'ALL' untuk global)
    const {
        data: scheduleData,
        isLoading: isLoadingSchedule,
        isRefetching: isRefetchingSchedule,
        refetch: refetchSchedule,
    } = useCategoryScheduleQuery(selectedCategoryId)

    // 4. Mutations & Action Handlers
    const {
        isGenerating,
        isGeneratingSingle,
        isGeneratingAll,
        isResetting,
        toast,
        clearToast,
        handleTriggerSchedule,
        handleTriggerAllSchedule,
        handleTriggerReset,
        handleConfirmRegenerate,
    } = useScheduleMutations({
        singleCategoryId,
        scheduleData,
        confirmModalMode,
        setConfirmModalMode,
        setIsConfirmModalOpen,
        setUnscheduledWarning,
        clearUnscheduledWarning,
    })

    return {
        scheduleMode,
        setScheduleMode,
        categories,
        selectedCategoryId,
        setSelectedCategoryId,
        singleCategoryId,
        selectedCategory,
        isAllMode,
        scheduleData,
        isLoadingCategories,
        isLoadingSchedule,
        isRefetchingSchedule,
        refetchSchedule,
        isCategoriesError,
        categoriesError,
        isGenerating,
        isGeneratingSingle,
        isGeneratingAll,
        isResetting,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        confirmModalMode,
        toast,
        clearToast,
        unscheduledWarning,
        clearUnscheduledWarning,
        handleTriggerSchedule,
        handleTriggerAllSchedule,
        handleTriggerReset,
        handleConfirmRegenerate,
    }
}
