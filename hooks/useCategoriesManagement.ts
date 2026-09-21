'use client'

import { useAdminCategoriesQuery } from '@/hooks/useAdminCategoriesQuery'
import {
    useCategoryFormModal,
    CategoryFormValues,
} from './useCategoryFormModal'
import {
    useCategoryMutations,
    ToastNotification,
} from './useCategoryMutations'

export type { CategoryFormValues, ToastNotification }

/**
 * useCategoriesManagement
 * Thin composer hook yang meng-orchestrate:
 * 1. Data querying (useAdminCategoriesQuery)
 * 2. Modal & Form state (useCategoryFormModal)
 * 3. Data mutations (useCategoryMutations)
 *
 * Mematuhi docs/component-architecture.md §K.
 */
export function useCategoriesManagement() {
    // 1. Modal & Form State Hook
    const {
        isAddModalOpen,
        openAddModal,
        closeAddModal,
        values,
        fieldErrors,
        setFieldErrors,
        isSubmitting,
        setIsSubmitting,
        onFieldChange,
        applySuggestedName,
    } = useCategoryFormModal()

    // 2. Mutations Hook (Create & Toggle Active)
    const {
        handleSubmit,
        toggleActive,
        togglingCategoryId,
        toast,
        clearToast,
    } = useCategoryMutations({
        values,
        setFieldErrors,
        setIsSubmitting,
        onSuccess: closeAddModal,
    })

    // 3. Admin Categories Query
    const {
        data: categories = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useAdminCategoriesQuery()

    return {
        // Categories data
        categories,
        isLoading,
        isError,
        error,
        refetch,

        // Modal state & actions
        isAddModalOpen,
        openAddModal,
        closeAddModal,

        // Form state & actions
        values,
        fieldErrors,
        isSubmitting,
        onFieldChange,
        applySuggestedName,
        handleSubmit,

        // Status toggle
        toggleActive,
        togglingCategoryId,

        // Toast notification
        toast,
        clearToast,
    }
}
