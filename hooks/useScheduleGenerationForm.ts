'use client'

import { useState, useCallback } from 'react'
import { Category } from '@/types/domain'
import { ScheduleGenerationMode } from './useScheduleFilters'

export interface UnscheduledWarningInfo {
    count: number
    matchIds: string[]
}

interface UseScheduleGenerationFormOptions {
    categories?: Category[]
    singleCategoryId?: string
    setSingleCategoryId?: (id: string) => void
}

/**
 * useScheduleGenerationForm
 * Mengelola parameter mode penjadwalan (Bertahap vs Paralel),
 * warning unscheduled matches, dan state modal konfirmasi regenerasi/reset.
 * Mematuhi docs/component-architecture.md §K.
 */
export function useScheduleGenerationForm({
    categories = [],
    singleCategoryId = '',
    setSingleCategoryId,
}: UseScheduleGenerationFormOptions = {}) {
    // 1. Mode Penjadwalan: 'step_by_step' (default) vs 'parallel'
    const [scheduleMode, setScheduleModeState] =
        useState<ScheduleGenerationMode>('step_by_step')

    // 2. State dialog konfirmasi (single regenerate, all regenerate, reset)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [confirmModalMode, setConfirmModalMode] =
        useState<'single' | 'all' | 'reset'>('single')

    // 3. State warning khusus unscheduled matches
    const [unscheduledWarning, setUnscheduledWarning] =
        useState<UnscheduledWarningInfo | null>(null)

    const clearUnscheduledWarning = useCallback(() => {
        setUnscheduledWarning(null)
    }, [])

    const setScheduleMode = useCallback(
        (mode: ScheduleGenerationMode) => {
            setScheduleModeState(mode)
            if (
                mode === 'step_by_step' &&
                !singleCategoryId &&
                categories.length > 0 &&
                setSingleCategoryId
            ) {
                setSingleCategoryId(categories[0].id)
            }
        },
        [categories, singleCategoryId, setSingleCategoryId]
    )

    return {
        scheduleMode,
        setScheduleMode,
        setScheduleModeState,
        unscheduledWarning,
        setUnscheduledWarning,
        clearUnscheduledWarning,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        confirmModalMode,
        setConfirmModalMode,
    }
}
