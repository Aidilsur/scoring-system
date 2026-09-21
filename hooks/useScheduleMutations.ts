'use client'

import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CATEGORY_SCHEDULE_QUERY_KEY } from './useScheduleQuery'
import {
    generateCategoryScheduleAction,
    generateAllCategoriesScheduleAction,
    resetAllGroupSchedulesAction,
} from '@/app/admin/(protected)/schedule/actions'
import { showToast } from '@/lib/toast'
import { UnscheduledWarningInfo } from './useScheduleGenerationForm'

export interface ScheduleToast {
    type: 'success' | 'error' | 'warning'
    message: string
}

interface UseScheduleMutationsOptions {
    singleCategoryId: string
    scheduleData?: { hasExistingSchedule?: boolean } | null
    confirmModalMode: 'single' | 'all' | 'reset'
    setConfirmModalMode: (mode: 'single' | 'all' | 'reset') => void
    setIsConfirmModalOpen: (open: boolean) => void
    setUnscheduledWarning: (warning: UnscheduledWarningInfo | null) => void
    clearUnscheduledWarning: () => void
}

/**
 * useScheduleMutations
 * Mengelola mutasi generate jadwal (kategori tunggal & paralel) serta reset jadwal,
 * query invalidation, toast notification, dan pemicu dialog konfirmasi.
 * Mematuhi docs/component-architecture.md §K.
 */
export function useScheduleMutations({
    singleCategoryId,
    scheduleData,
    confirmModalMode,
    setConfirmModalMode,
    setIsConfirmModalOpen,
    setUnscheduledWarning,
    clearUnscheduledWarning,
}: UseScheduleMutationsOptions) {
    const queryClient = useQueryClient()
    const [toast, setToast] = useState<ScheduleToast | null>(null)

    const clearToast = useCallback(() => {
        setToast(null)
    }, [])

    // 1. Mutation untuk generate per-kategori (Generate Bertahap)
    const { mutateAsync: runGenerateSchedule, isPending: isGeneratingSingle } =
        useMutation({
            mutationFn: async (catId: string) => {
                return await generateCategoryScheduleAction(catId)
            },
            onSuccess: (result) => {
                queryClient.invalidateQueries({
                    queryKey: CATEGORY_SCHEDULE_QUERY_KEY,
                })

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
                    err instanceof Error
                        ? err.message
                        : 'Terjadi kesalahan sistem saat membuat jadwal.'
                setToast({
                    type: 'error',
                    message: errMsg,
                })
                showToast.error(errMsg)
            },
        })

    // 2. Mutation untuk generate SEMUA kategori secara paralel
    const { mutateAsync: runGenerateAllSchedule, isPending: isGeneratingAll } =
        useMutation({
            mutationFn: async () => {
                return await generateAllCategoriesScheduleAction()
            },
            onSuccess: (result) => {
                queryClient.invalidateQueries({
                    queryKey: CATEGORY_SCHEDULE_QUERY_KEY,
                })

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
                    err instanceof Error
                        ? err.message
                        : 'Terjadi kesalahan sistem saat membuat jadwal paralel.'
                setToast({
                    type: 'error',
                    message: errMsg,
                })
                showToast.error(errMsg)
            },
        })

    // 3. Mutation untuk Reset Semua Jadwal Pertandingan Babak Grup
    const { mutateAsync: runResetAllSchedules, isPending: isResetting } =
        useMutation({
            mutationFn: async () => {
                return await resetAllGroupSchedulesAction()
            },
            onSuccess: (result) => {
                queryClient.invalidateQueries({
                    queryKey: CATEGORY_SCHEDULE_QUERY_KEY,
                })

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
                    err instanceof Error
                        ? err.message
                        : 'Terjadi kesalahan sistem saat mereset jadwal.'
                setToast({
                    type: 'error',
                    message: errMsg,
                })
                showToast.error(errMsg)
            },
        })

    // 4. Action Handlers
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
    }, [
        singleCategoryId,
        scheduleData?.hasExistingSchedule,
        clearToast,
        clearUnscheduledWarning,
        runGenerateSchedule,
        setConfirmModalMode,
        setIsConfirmModalOpen,
    ])

    const handleTriggerAllSchedule = useCallback(async () => {
        if (scheduleData?.hasExistingSchedule) {
            setConfirmModalMode('all')
            setIsConfirmModalOpen(true)
            return
        }

        clearToast()
        clearUnscheduledWarning()
        await runGenerateAllSchedule()
    }, [
        scheduleData?.hasExistingSchedule,
        clearToast,
        clearUnscheduledWarning,
        runGenerateAllSchedule,
        setConfirmModalMode,
        setIsConfirmModalOpen,
    ])

    const handleTriggerReset = useCallback(() => {
        setConfirmModalMode('reset')
        setIsConfirmModalOpen(true)
    }, [setConfirmModalMode, setIsConfirmModalOpen])

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
    }, [
        confirmModalMode,
        singleCategoryId,
        clearToast,
        clearUnscheduledWarning,
        runResetAllSchedules,
        runGenerateAllSchedule,
        runGenerateSchedule,
        setIsConfirmModalOpen,
    ])

    const isGenerating = isGeneratingSingle || isGeneratingAll || isResetting

    return {
        isGenerating,
        isGeneratingSingle,
        isGeneratingAll,
        isResetting,
        toast,
        clearToast,
        handleTriggerSchedule,
        handleTriggerAllSchedule,
        handleTriggerReset,
        handleConfirmRegenerate: handleConfirmModalAction,
    }
}
