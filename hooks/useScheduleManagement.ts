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
} from '@/app/admin/(protected)/schedule/actions'

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

    // 1. Kategori yang dipilih ('ALL' untuk seluruh kategori gabungan paralel)
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
        initialCategoryId || 'ALL'
    )

    // 2. State dialog konfirmasi regenerate
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [confirmModalMode, setConfirmModalMode] = useState<'single' | 'all'>('all')

    // 3. State notifikasi toast
    const [toast, setToast] = useState<ScheduleToast | null>(null)

    // 4. State warning khusus unscheduled matches
    const [unscheduledWarning, setUnscheduledWarning] = useState<UnscheduledWarningInfo | null>(null)

    const clearToast = useCallback(() => {
        setToast(null)
    }, [])

    const clearUnscheduledWarning = useCallback(() => {
        setUnscheduledWarning(null)
    }, [])

    // 5. Query kategori aktif yang sudah di-draw
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
        isError: isCategoriesError,
        error: categoriesError,
    } = useCategoriesWithGroupsQuery()

    // Default ke 'ALL' jika belum ada pilihan
    useEffect(() => {
        if (!selectedCategoryId) {
            setSelectedCategoryId('ALL')
        }
    }, [selectedCategoryId])

    // 6. Query data jadwal per kategori (atau 'ALL' untuk global)
    const {
        data: scheduleData,
        isLoading: isLoadingSchedule,
        isRefetching: isRefetchingSchedule,
        refetch: refetchSchedule,
    } = useCategoryScheduleQuery(selectedCategoryId)

    // 7. Mutation untuk generate per-kategori
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
                    setUnscheduledWarning({
                        count: result.unscheduledCount,
                        matchIds: result.unscheduledMatchIds || [],
                    })
                } else {
                    setToast({
                        type: 'success',
                        message: result.message,
                    })
                    setUnscheduledWarning(null)
                }
            } else {
                setToast({
                    type: 'error',
                    message: result.message,
                })
            }
        },
        onError: (err: unknown) => {
            setToast({
                type: 'error',
                message:
                    err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat membuat jadwal.',
            })
        },
    })

    // 8. Mutation untuk generate SEMUA kategori secara paralel
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
                    setUnscheduledWarning({
                        count: result.unscheduledCount,
                        matchIds: result.unscheduledMatchIds || [],
                    })
                } else {
                    setToast({
                        type: 'success',
                        message: result.message,
                    })
                    setUnscheduledWarning(null)
                }
            } else {
                setToast({
                    type: 'error',
                    message: result.message,
                })
            }
        },
        onError: (err: unknown) => {
            setToast({
                type: 'error',
                message:
                    err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat membuat jadwal paralel.',
            })
        },
    })

    // 9. Action handlers
    const handleTriggerSchedule = useCallback(async () => {
        if (!selectedCategoryId) return

        if (selectedCategoryId === 'ALL') {
            if (scheduleData?.hasExistingSchedule) {
                setConfirmModalMode('all')
                setIsConfirmModalOpen(true)
                return
            }
            clearToast()
            clearUnscheduledWarning()
            await runGenerateAllSchedule()
            return
        }

        // Mode single category
        if (scheduleData?.hasExistingSchedule) {
            setConfirmModalMode('single')
            setIsConfirmModalOpen(true)
            return
        }

        clearToast()
        clearUnscheduledWarning()
        await runGenerateSchedule(selectedCategoryId)
    }, [selectedCategoryId, scheduleData?.hasExistingSchedule, clearToast, clearUnscheduledWarning, runGenerateAllSchedule, runGenerateSchedule])

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

    const handleConfirmRegenerate = useCallback(async () => {
        setIsConfirmModalOpen(false)
        clearToast()
        clearUnscheduledWarning()

        if (confirmModalMode === 'all') {
            await runGenerateAllSchedule()
        } else if (selectedCategoryId && selectedCategoryId !== 'ALL') {
            await runGenerateSchedule(selectedCategoryId)
        }
    }, [confirmModalMode, selectedCategoryId, clearToast, clearUnscheduledWarning, runGenerateAllSchedule, runGenerateSchedule])

    const isAllMode = selectedCategoryId === 'ALL'
    const selectedCategory = isAllMode
        ? {
              id: 'ALL',
              name: 'Semua Kategori (Jadwal Gabungan Paralel)',
              partner_type: 'fix' as const,
              level: 'bronze' as const,
              is_active: true,
              created_at: '',
          }
        : categories.find((c) => c.id === selectedCategoryId)

    const isGenerating = isGeneratingSingle || isGeneratingAll

    return {
        categories,
        selectedCategoryId,
        setSelectedCategoryId,
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
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        confirmModalMode,
        toast,
        clearToast,
        unscheduledWarning,
        clearUnscheduledWarning,
        handleTriggerSchedule,
        handleTriggerAllSchedule,
        handleConfirmRegenerate,
    }
}
