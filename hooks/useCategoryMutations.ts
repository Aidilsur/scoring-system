'use client'

import { useState, useCallback } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import {
    createCategoryAction,
    toggleCategoryActiveAction,
} from '@/app/admin/(protected)/categories/actions'
import { categorySchema, CategoryInput } from '@/lib/validations/category'
import { CategoryFormValues } from './useCategoryFormModal'

export interface ToastNotification {
    type: 'success' | 'error'
    message: string
}

export interface UseCategoryMutationsOptions {
    values: CategoryFormValues
    setFieldErrors: (errors: Record<string, string>) => void
    setIsSubmitting: (isSubmitting: boolean) => void
    onSuccess?: () => void
}

export function useCategoryMutations({
    values,
    setFieldErrors,
    setIsSubmitting,
    onSuccess,
}: UseCategoryMutationsOptions) {
    const queryClient = useQueryClient()

    // 1. Status Toggle Loading State
    const [togglingCategoryId, setTogglingCategoryId] = useState<string | null>(null)

    // 2. Toast Notification State
    const [toast, setToast] = useState<ToastNotification | null>(null)

    const clearToast = useCallback(() => {
        setToast(null)
    }, [])

    // 3. Submit Add Category Mutation
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

                // Invalidate queries
                await queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
                await queryClient.invalidateQueries({ queryKey: ['categories'] })

                setToast({
                    type: 'success',
                    message: res.message,
                })

                onSuccess?.()
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
        [values, queryClient, onSuccess, setFieldErrors, setIsSubmitting]
    )

    // 4. Toggle Active Mutation
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
        handleSubmit,
        toggleActive,
        togglingCategoryId,
        toast,
        clearToast,
    }
}
