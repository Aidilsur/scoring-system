'use client'

import { useCallback } from 'react'
import { RegisterActionResponse } from '@/app/register/actions'
import { validatePaymentProofFile } from '@/lib/validations/team-registration'
import { useTeamRegistrationForm } from './useTeamRegistrationForm'
import { usePaymentReceiptUpload } from './usePaymentReceiptUpload'
import { useTeamRegistrationSubmit } from './useTeamRegistrationSubmit'

interface UseTeamRegistrationReturn {
    isSubmitting: boolean
    response: RegisterActionResponse | null
    errors: Record<string, string>
    selectedFile: File | null
    filePreview: string | null
    formRef: React.RefObject<HTMLFormElement | null>
    fileInputRef: React.RefObject<HTMLInputElement | null>
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    removeFile: () => void
    resetSuccessState: () => void
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
}

/**
 * Thin composer hook untuk formulir pendaftaran tim.
 * Meng-compose tiga hook bertanggung jawab tunggal:
 * - useTeamRegistrationForm  : state errors form & validasi Zod
 * - usePaymentReceiptUpload  : validasi file (mime, size) & preview
 * - useTeamRegistrationSubmit: panggil Server Action, loading state, toast
 */
export function useTeamRegistration(): UseTeamRegistrationReturn {
    const form = useTeamRegistrationForm()
    const upload = usePaymentReceiptUpload()

    // Merge errors: form errors + file upload error
    const mergedErrors: Record<string, string> = {
        ...form.errors,
        ...(upload.fileError ? { payment_proof: upload.fileError } : {}),
    }

    // Saat file change dari upload hook, sync payment_proof error ke form errors jika ada
    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            upload.handleFileChange(e)
            // Hapus error payment_proof dari form jika file baru berhasil dipilih
            // (error file dikelola langsung oleh upload.fileError, bukan form.errors)
            form.setErrors((prev) => {
                const next = { ...prev }
                delete next.payment_proof
                return next
            })
        },
        [upload, form]
    )

    const { isSubmitting, response, resetResponse, submit } = useTeamRegistrationSubmit({
        onSuccess: () => {
            form.formRef.current?.reset()
            form.clearErrors()
            upload.resetUpload()
        },
        onFieldErrors: (fieldErrors) => {
            form.setErrors(fieldErrors)
        },
    })

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()

            const formData = new FormData(e.currentTarget)

            await submit({
                formData,
                selectedFile: upload.selectedFile,
                validateForm: form.validateFormData,
                validateFile: validatePaymentProofFile,
                onValidationErrors: (errors) => {
                    // Pisahkan error file dari form errors
                    const { payment_proof, ...formOnly } = errors
                    form.setErrors(formOnly)
                    if (payment_proof) {
                        upload.clearFileError()
                        // Masukkan payment_proof ke form.errors agar merged ke mergedErrors
                        form.setErrors((prev) => ({ ...prev, payment_proof }))
                    }
                },
                scrollToFirstError: form.scrollToFirstError,
            })
        },
        [submit, upload, form]
    )

    // Reset semua state (sukses → daftar tim lain)
    const resetSuccessState = useCallback(() => {
        resetResponse()
        form.clearErrors()
        upload.resetUpload()
    }, [resetResponse, form, upload])

    return {
        isSubmitting,
        response,
        errors: mergedErrors,
        selectedFile: upload.selectedFile,
        filePreview: upload.filePreview,
        formRef: form.formRef,
        fileInputRef: upload.fileInputRef,
        handleFileChange,
        removeFile: upload.removeFile,
        resetSuccessState,
        handleSubmit,
    }
}
