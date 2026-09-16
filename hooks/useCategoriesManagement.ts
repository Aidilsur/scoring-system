'use client'

import { useState, useCallback } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useAdminCategoriesQuery } from '@/hooks/useAdminCategoriesQuery'
import {
    createCategoryAction,
    toggleCategoryActiveAction,
} from '@/app/admin/(protected)/categories/actions'
import { categorySchema, CategoryInput } from '@/lib/validations/category'
import { PartnerType, CategoryLevel } from '@/types/domain'

export interface CategoryFormValues {
    name: string
    partner_type: PartnerType
    level: CategoryLevel
    is_active: boolean
}

interface ToastNotification {
    type: 'success' | 'error'
    message: string
}

const INITIAL_FORM_VALUES: CategoryFormValues = {
    name: '',
    partner_type: 'fix',
    level: 'bronze',
    is_active: true,
}

export function useCategoriesManagement() {
    const queryClient = useQueryClient()

    // 1. Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // 2. Form State
    const [values, setValues] = useState<CategoryFormValues>(INITIAL_FORM_VALUES)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 3. Status Toggle Loading State
    const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null)

    // 4. Toast Notification
    const [toast, setToast] = useState<ToastNotification | null>(null)

    const clearToast = useCallback(() => {
        setToast(null)
    }, [])

    // 5. Query Categories
    const {
        data: categories = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useAdminCategoriesQuery()

    // 6. Modal Open / Close Handlers
    const openAddModal = useCallback(() => {
        setValues(INITIAL_FORM_VALUES)
        setFieldErrors({})
        setIsAddModalOpen(true)
    }, [])

    const closeAddModal = useCallback(() => {
        setIsAddModalOpen(false)
        setFieldErrors({})
    }, [])

    // 7. Field Change Handler
    const onFieldChange = useCallback(
        <K extends keyof CategoryFormValues>(field: K, val: CategoryFormValues[K]) => {
            setValues((prev) => ({
                ...prev,
                [field]: val,
            }))

            setFieldErrors((prev) => {
                if (!prev[field]) return prev
                const copy = { ...prev }
                delete copy[field]
                return copy
            })
        },
        []
    )

    // Helper: Generate Suggested Name from selections
    const applySuggestedName = useCallback(() => {
        const partnerLabel = values.partner_type === 'fix' ? 'Fix Partner' : 'Mix Partner'
        const levelLabel =
            values.level === 'beginner'
                ? 'Beginner'
                : values.level === 'lower_bronze'
                ? 'Lower Bronze'
                : 'Bronze'
        onFieldChange('name', `${partnerLabel} - ${levelLabel}`)
    }, [values.partner_type, values.level, onFieldChange])

    // 8. Submit Add Category Mutation
    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            setIsSubmitting(true)
            setFieldErrors({})

            // Client-side Zod validation
            const validation = categorySchema.safeParse(values)
            if (!validation.success) {
                const errors: Record<string, string> = {}
                for (const issue of validation.error.issues) {
                    const fieldName = issue.path[0]?.toString() || 'general'
                    errors[fieldName] = issue.message
                }
                setFieldErrors(errors)
                setIsSubmitting(false)
                return
            }

            try {
                const res = await createCategoryAction(validation.data as CategoryInput)

                if (!res.success) {
                    if (res.errors) {
                        setFieldErrors(res.errors)
                    }
                    setToast({
                        type: 'error',
                        message: res.message,
                    })
                    setIsSubmitting(false)
                    return
                }

                // Invalidate query
                await queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
                await queryClient.invalidateQueries({ queryKey: ['categories'] })

                setToast({
                    type: 'success',
                    message: res.message,
                })

                closeAddModal()
            } catch (err: unknown) {
                const errMsg =
                    err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
                setToast({
                    type: 'error',
                    message: errMsg,
                })
            } finally {
                setIsSubmitting(false)
            }
        },
        [values, queryClient, closeAddModal]
    )

    // 9. Toggle Active Mutation
    const toggleMutation = useMutation({
        mutationFn: async ({
            categoryId,
            isActive,
        }: {
            categoryId: string
            isActive: boolean
        }) => {
            setTogglingCategoryId(categoryId)
            return await toggleCategoryActiveAction(categoryId, isActive)
        },
        onSuccess: (res) => {
            if (res.success) {
                setToast({
                    type: 'success',
                    message: res.message,
                })
                queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
                queryClient.invalidateQueries({ queryKey: ['categories'] })
            } else {
                setToast({
                    type: 'error',
                    message: res.message,
                })
            }
        },
        onError: (err: Error) => {
            setToast({
                type: 'error',
                message: err.message || 'Gagal mengubah status kategori.',
            })
        },
        onSettled: () => {
            setTogglingCategoryId(null)
        },
    })

    const toggleActive = useCallback(
        (categoryId: string, currentStatus: boolean) => {
            toggleMutation.mutate({
                categoryId,
                isActive: !currentStatus,
            })
        },
        [toggleMutation]
    )

    return {
        categories,
        isLoading,
        isError,
        error,
        refetch,
        isAddModalOpen,
        openAddModal,
        closeAddModal,
        values,
        fieldErrors,
        isSubmitting,
        onFieldChange,
        applySuggestedName,
        handleSubmit,
        toggleActive,
        togglingCategoryId,
        toast,
        clearToast,
    }
}
