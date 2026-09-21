'use client'

import { useState, useCallback } from 'react'
import { PartnerType, CategoryLevel } from '@/types/domain'

export interface CategoryFormValues {
    name: string
    partner_type: PartnerType
    level: CategoryLevel
    is_active: boolean
}

export const INITIAL_FORM_VALUES: CategoryFormValues = {
    name: '',
    partner_type: 'fix',
    level: 'bronze',
    is_active: true,
}

export function useCategoryFormModal() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [values, setValues] = useState<CategoryFormValues>(INITIAL_FORM_VALUES)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const openAddModal = useCallback(() => {
        setValues(INITIAL_FORM_VALUES)
        setFieldErrors({})
        setIsAddModalOpen(true)
    }, [])

    const closeAddModal = useCallback(() => {
        setIsAddModalOpen(false)
        setFieldErrors({})
    }, [])

    const resetForm = useCallback(() => {
        setValues(INITIAL_FORM_VALUES)
        setFieldErrors({})
        setIsSubmitting(false)
    }, [])

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

    const applySuggestedName = useCallback(() => {
        const partnerLabel =
            values.partner_type === 'fix' ? 'Fix Partner' : 'Mix Partner'
        const levelLabel =
            values.level === 'beginner'
                ? 'Beginner'
                : values.level === 'lower_bronze'
                ? 'Lower Bronze'
                : 'Bronze'
        onFieldChange('name', `${partnerLabel} - ${levelLabel}`)
    }, [values.partner_type, values.level, onFieldChange])

    return {
        isAddModalOpen,
        openAddModal,
        closeAddModal,
        values,
        setValues,
        fieldErrors,
        setFieldErrors,
        isSubmitting,
        setIsSubmitting,
        onFieldChange,
        applySuggestedName,
        resetForm,
    }
}
