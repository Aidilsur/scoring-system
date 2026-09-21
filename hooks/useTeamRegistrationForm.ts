'use client'

import { useState, useRef } from 'react'
import { teamRegistrationSchema } from '@/lib/validations/team-registration'

export interface FormValidationErrors extends Record<string, string> {}

export interface UseTeamRegistrationFormReturn {
    errors: FormValidationErrors
    formRef: React.RefObject<HTMLFormElement | null>
    setErrors: React.Dispatch<React.SetStateAction<FormValidationErrors>>
    clearErrors: () => void
    validateFormData: (formData: FormData) => {
        success: boolean
        errors: FormValidationErrors
    }
    scrollToFirstError: (errorKeys: string[]) => void
}

/**
 * Mengelola state form errors dan validasi Zod sisi klien
 * untuk formulir pendaftaran tim.
 */
export function useTeamRegistrationForm(): UseTeamRegistrationFormReturn {
    const [errors, setErrors] = useState<FormValidationErrors>({})
    const formRef = useRef<HTMLFormElement>(null)

    const clearErrors = () => setErrors({})

    function validateFormData(formData: FormData): {
        success: boolean
        errors: FormValidationErrors
    } {
        const rawValues = {
            category_id: formData.get('category_id')?.toString() || '',
            player1_name: formData.get('player1_name')?.toString() || '',
            player2_name: formData.get('player2_name')?.toString() || '',
            phone_number: formData.get('phone_number')?.toString() || '',
            instagram_handle: formData.get('instagram_handle')?.toString() || '',
            reclub_handle: formData.get('reclub_handle')?.toString() || '',
        }

        const zodResult = teamRegistrationSchema.safeParse(rawValues)
        const validationErrors: FormValidationErrors = {}

        if (!zodResult.success) {
            for (const issue of zodResult.error.issues) {
                const fieldName = issue.path[0]?.toString()
                if (fieldName && !validationErrors[fieldName]) {
                    validationErrors[fieldName] = issue.message
                }
            }
        }

        return {
            success: Object.keys(validationErrors).length === 0,
            errors: validationErrors,
        }
    }

    function scrollToFirstError(errorKeys: string[]) {
        const firstKey = errorKeys[0]
        if (!firstKey) return
        const el = document.getElementById(firstKey)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    return {
        errors,
        formRef,
        setErrors,
        clearErrors,
        validateFormData,
        scrollToFirstError,
    }
}
