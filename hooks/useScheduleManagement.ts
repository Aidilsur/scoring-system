'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    useCategoriesWithGroupsQuery,
    useCategoryScheduleQuery,
    CATEGORY_SCHEDULE_QUERY_KEY,
} from './useScheduleQuery'
import {
    generateCategoryScheduleAction,
    generateAllCategoriesScheduleAction,
    resetAllGroupSchedulesAction,
} from '@/app/admin/(protected)/schedule/actions'
import { showToast } from '@/lib/toast'

export type ScheduleGenerationMode = 'step_by_step' | 'parallel'

export interface ScheduleToast {
    type: 'success' | 'error' | 'warning'
    message: string
}

export interface UnscheduledWarningInfo {
    count: number
    matchIds: string[]
}

export function useScheduleManagement(initialCategoryId?: string) {
    const queryClient = useQueryClient()

    // 1. Mode Penjadwalan: 'step_by_step' (default) vs 'parallel'
    const [scheduleMode, setScheduleModeState] = useState<ScheduleGenerationMode>('step_by_step')

    // 2. Kategori yang dipilih untuk mode bertahap (single category)
    const [singleCategoryId, setSingleCategoryId] = useState<string>(
        initialCategoryId && initialCategoryId !== 'ALL' ? initialCategoryId : ''
    )

    // 3. State dialog konfirmasi (single regenerate, all regenerate, reset)
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [confirmModalMode, setConfirmModalMode] = useState<'single' | 'all' | 'reset'>('single')

    // 4. State notifikasi toast
    const [toast, setToast] = useState<ScheduleToast | null>(null)

    // 5. State warning khusus unscheduled matches
    const [unscheduledWarning, setUnscheduledWarning] = useState<UnscheduledWarningInfo | null>(null)

    const clearToast = useCallback(() => {
        setToast(null)
    }, [])

    const clearUnscheduledWarning = useCallback(() => {
        setUnscheduledWarning(null)
    }, [])

    // 6. Query semua kategori yang sudah memiliki groups hasil draw
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
    const selectedCategoryId = scheduleMode === 'parallel' ? 'ALL' : singleCategoryId

    const setScheduleMode = useCallback(
        (mode: ScheduleGenerationMode) => {
            setScheduleModeState(mode)
            if (mode === 'step_by_step' && !singleCategoryId && categories.length > 0) {
                setSingleCategoryId(categories[0].id)
            }
        },
        [categories, singleCategoryId]
    )

    const setSelectedCategoryId = useCallback((id: string) => {
        setSingleCategoryId(id)
    }, [])

    // 7. Query data jadwal untuk kategori terpilih (atau 'ALL' untuk global)
    const {
        data: scheduleData,
        isLoading: isLoadingSchedule,
        isRefetching: isRefetchingSchedule,
        refetch: refetchSchedule,
    } = useCategoryScheduleQuery(selectedCategoryId)

    // 8. Mutation untuk generate per-kategori (Generate Bertahap)
    const { mutateAsync: runGenerateSchedule, isPending: isGeneratingSingle } = useMutation({
        mutationFn: async (catId: string) => {
            return await generateCategoryScheduleAction(catId)
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_SCHEDULE_QUERY_KEY })

            if (result.success) {
                if (result.unscheduledCount && result.unscheduledCount > 0) {
                    setToast({
                        type: 'warning',
                        message: result.message,
                    })
                    showToast.warning(result.message)
                    setUnscheduledWarning({
                        count: result.unscheduledCount,
                        matchIds: result.unscheduledMatchIds || [],
                    })
                } else {
                    setToast({
                        type: 'success',
                        message: result.message,
                    })
                    showToast.success(result.message)
                    setUnscheduledWarning(null)
                }
            } else {
                setToast({
                    type: 'error',
                    message: result.message,
                })
                showToast.error(result.message)
            }
        },
        onError: (err: unknown) => {
            const errMsg =
                err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat membuat jadwal.'
            setToast({
                type: 'error',
                message: errMsg,
            })
            showToast.error(errMsg)
        },
    })

    // 9. Mutation untuk generate SEMUA kategori secara paralel
    const { mutateAsync: runGenerateAllSchedule, isPending: isGeneratingAll } = useMutation({
        mutationFn: async () => {
            return await generateAllCategoriesScheduleAction()
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_SCHEDULE_QUERY_KEY })

            if (result.success) {
                if (result.unscheduledCount && result.unscheduledCount > 0) {
                    setToast({
                        type: 'warning',
                        message: result.message,
                    })
                    showToast.warning(result.message)
                    setUnscheduledWarning({
                        count: result.unscheduledCount,
                        matchIds: result.unscheduledMatchIds || [],
                    })
                } else {
                    setToast({
                        type: 'success',
                        message: result.message,
                    })
                    showToast.success(result.message)
                    setUnscheduledWarning(null)
                }
            } else {
                setToast({
                    type: 'error',
                    message: result.message,
                })
                showToast.error(result.message)
            }
        },
        onError: (err: unknown) => {
            const errMsg =
                err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat membuat jadwal paralel.'
            setToast({
                type: 'error',
                message: errMsg,
            })
            showToast.error(errMsg)
        },
    })

    // 10. Mutation untuk Reset Semua Jadwal Pertandingan Babak Grup
    const { mutateAsync: runResetAllSchedules, isPending: isResetting } = useMutation({
        mutationFn: async () => {
            return await resetAllGroupSchedulesAction()
        },
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: CATEGORY_SCHEDULE_QUERY_KEY })

            if (result.success) {
                setToast({
                    type: 'success',
                    message: result.message,
                })
                showToast.success(result.message)
                setUnscheduledWarning(null)
            } else {
                setToast({
                    type: 'error',
                    message: result.message,
                })
                showToast.error(result.message)
            }
        },
        onError: (err: unknown) => {
            const errMsg =
                err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mereset jadwal.'
            setToast({
                type: 'error',
                message: errMsg,
            })
            showToast.error(errMsg)
        },
    })

    // 11. Action Handlers
    const handleTriggerSchedule = useCallback(async () => {
        if (!singleCategoryId) return

        if (scheduleData?.hasExistingSchedule) {
            setConfirmModalMode('single')
            setIsConfirmModalOpen(true)
            return
        }

        clearToast()
        clearUnscheduledWarning()
        await runGenerateSchedule(singleCategoryId)
    }, [singleCategoryId, scheduleData?.hasExistingSchedule, clearToast, clearUnscheduledWarning, runGenerateSchedule])

    const handleTriggerAllSchedule = useCallback(async () => {
        if (scheduleData?.hasExistingSchedule) {
            setConfirmModalMode('all')
            setIsConfirmModalOpen(true)
            return
        }

        clearToast()
        clearUnscheduledWarning()
        await runGenerateAllSchedule()
    }, [scheduleData?.hasExistingSchedule, clearToast, clearUnscheduledWarning, runGenerateAllSchedule])

    const handleTriggerReset = useCallback(() => {
        setConfirmModalMode('reset')
        setIsConfirmModalOpen(true)
    }, [])

    const handleConfirmModalAction = useCallback(async () => {
        setIsConfirmModalOpen(false)
        clearToast()
        clearUnscheduledWarning()

        if (confirmModalMode === 'reset') {
            await runResetAllSchedules()
        } else if (confirmModalMode === 'all') {
            await runGenerateAllSchedule()
        } else if (singleCategoryId) {
            await runGenerateSchedule(singleCategoryId)
        }
    }, [confirmModalMode, singleCategoryId, clearToast, clearUnscheduledWarning, runResetAllSchedules, runGenerateAllSchedule, runGenerateSchedule])

    const isAllMode = scheduleMode === 'parallel'
    const selectedCategory = isAllMode
        ? {
              id: 'ALL',
              name: 'Semua Kategori (Jadwal Gabungan Paralel)',
              partner_type: 'fix' as const,
              level: 'bronze' as const,
              is_active: true,
              created_at: '',
          }
        : categories.find((c) => c.id === singleCategoryId)

    const isGenerating = isGeneratingSingle || isGeneratingAll || isResetting

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
        handleConfirmRegenerate: handleConfirmModalAction,
    }
}
