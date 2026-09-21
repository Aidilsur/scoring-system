'use client'

import { useState, useTransition, useCallback } from 'react'
import { registerTeamAction, RegisterActionResponse } from '@/app/register/actions'
import { validatePaymentProofFile } from '@/lib/validations/team-registration'
import { toast } from '@/lib/toast'

export interface UseTeamRegistrationSubmitOptions {
    /** Dipanggil saat Server Action berhasil — untuk reset form & upload state */
    onSuccess: () => void
    /** Dipanggil saat Server Action mengembalikan field errors — untuk mengisi ulang error di form */
    onFieldErrors: (errors: Record<string, string>) => void
}

export interface UseTeamRegistrationSubmitReturn {
    isSubmitting: boolean
    response: RegisterActionResponse | null
    resetResponse: () => void
    submit: (params: {
        formData: FormData
        selectedFile: File | null
        validateForm: (formData: FormData) => { success: boolean; errors: Record<string, string> }
        validateFile: (file: unknown) => { success: boolean; error?: string }
        onValidationErrors: (errors: Record<string, string>) => void
        scrollToFirstError: (keys: string[]) => void
    }) => Promise<void>
}

/**
 * Mengelola pemanggilan Server Action registerTeamAction:
 * - Menerima hasil validasi dari hook lain (tidak memvalidasi ulang)
 * - Menampilkan toast sukses/error via @/lib/toast (§J component-architecture.md)
 * - Menyimpan response untuk ditampilkan komponen sebagai inline feedback
 */
export function useTeamRegistrationSubmit({
    onSuccess,
    onFieldErrors,
}: UseTeamRegistrationSubmitOptions): UseTeamRegistrationSubmitReturn {
    const [isSubmitting, startTransition] = useTransition()
    const [response, setResponse] = useState<RegisterActionResponse | null>(null)

    const resetResponse = useCallback(() => setResponse(null), [])

    const submit = useCallback(
        async ({
            formData,
            selectedFile,
            validateForm,
            validateFile,
            onValidationErrors,
            scrollToFirstError,
        }: {
            formData: FormData
            selectedFile: File | null
            validateForm: (formData: FormData) => { success: boolean; errors: Record<string, string> }
            validateFile: (file: unknown) => { success: boolean; error?: string }
            onValidationErrors: (errors: Record<string, string>) => void
            scrollToFirstError: (keys: string[]) => void
        }) => {
            setResponse(null)

            // Fail-safe: jika browser FormData belum menangkap file tapi selectedFile ada di state
            const currentFileInForm = formData.get('payment_proof')
            const isFileEmpty =
                !currentFileInForm ||
                (currentFileInForm instanceof File && currentFileInForm.size === 0)
            if (isFileEmpty && selectedFile) {
                formData.set('payment_proof', selectedFile)
            }

            const formValidation = validateForm(formData)
            const fileValidation = validateFile(formData.get('payment_proof'))

            const combinedErrors: Record<string, string> = { ...formValidation.errors }
            if (!fileValidation.success && fileValidation.error) {
                combinedErrors['payment_proof'] = fileValidation.error
            }

            if (Object.keys(combinedErrors).length > 0) {
                onValidationErrors(combinedErrors)
                scrollToFirstError(Object.keys(combinedErrors))
                return
            }

            startTransition(async () => {
                const res = await registerTeamAction(null, formData)
                setResponse(res)

                if (res.success) {
                    toast.success('Pendaftaran berhasil dikirim!', res.message)
                    onSuccess()
                } else if (res.errors) {
                    toast.error('Gagal mengirim pendaftaran', res.message)
                    onFieldErrors(res.errors)
                } else {
                    toast.error('Gagal mengirim pendaftaran', res.message)
                }
            })
        },
        [onSuccess, onFieldErrors]
    )

    return { isSubmitting, response, resetResponse, submit }
}
