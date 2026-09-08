'use client'

import { useState, useRef, useTransition, useCallback } from 'react'
import { registerTeamAction, RegisterActionResponse } from '@/app/register/actions'
import {
    teamRegistrationSchema,
    validatePaymentProofFile,
} from '@/lib/validations/team-registration'

export interface UseTeamRegistrationReturn {
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
 * Custom hook untuk mengelola state dan business logic pendaftaran tim:
 * - Validasi Zod form & file
 * - Pemanggilan Server Action registerTeamAction
 * - Manajemen file preview & cleanup
 * - Error handling & loading state
 */
export function useTeamRegistration(): UseTeamRegistrationReturn {
    const [isSubmitting, startTransition] = useTransition()
    const [response, setResponse] = useState<RegisterActionResponse | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)

    const formRef = useRef<HTMLFormElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handler pemilihan file bukti transfer
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        if (!file) {
            setSelectedFile(null)
            setFilePreview(null)
            return
        }

        const fileCheck = validatePaymentProofFile(file)
        if (!fileCheck.success && fileCheck.error) {
            setErrors((prev) => ({ ...prev, payment_proof: fileCheck.error! }))
            setSelectedFile(null)
            setFilePreview(null)
            return
        }

        // Hapus error bukti pembayaran jika file valid
        setErrors((prev) => {
            const next = { ...prev }
            delete next.payment_proof
            return next
        })

        setSelectedFile(file)

        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file)
            setFilePreview(url)
        } else {
            setFilePreview(null)
        }
    }, [])

    // Hapus file yang sudah dipilih
    const removeFile = useCallback(() => {
        setSelectedFile(null)
        if (filePreview) {
            URL.revokeObjectURL(filePreview)
            setFilePreview(null)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [filePreview])

    // Reset notifikasi sukses jika ingin mendaftarkan tim lain
    const resetSuccessState = useCallback(() => {
        setResponse(null)
        setErrors({})
        setSelectedFile(null)
        setFilePreview(null)
    }, [])

    // Handler submit formulir
    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            setResponse(null)

            const formData = new FormData(e.currentTarget)

            // Fail-safe: jika browser FormData belum menangkap file tapi selectedFile ada di state
            const currentFileInForm = formData.get('payment_proof')
            if ((!currentFileInForm || (currentFileInForm instanceof File && currentFileInForm.size === 0)) && selectedFile) {
                formData.set('payment_proof', selectedFile)
            }

            // Ekstrak nilai untuk validasi Zod client-side cepat
            const rawValues = {
                category_id: formData.get('category_id')?.toString() || '',
                player1_name: formData.get('player1_name')?.toString() || '',
                player2_name: formData.get('player2_name')?.toString() || '',
                phone_number: formData.get('phone_number')?.toString() || '',
                instagram_handle: formData.get('instagram_handle')?.toString() || '',
                reclub_handle: formData.get('reclub_handle')?.toString() || '',
            }

            const zodResult = teamRegistrationSchema.safeParse(rawValues)
            const fileResult = validatePaymentProofFile(formData.get('payment_proof'))

            const validationErrors: Record<string, string> = {}

            if (!zodResult.success) {
                for (const issue of zodResult.error.issues) {
                    const fieldName = issue.path[0]?.toString()
                    if (fieldName && !validationErrors[fieldName]) {
                        validationErrors[fieldName] = issue.message
                    }
                }
            }

            if (!fileResult.success && fileResult.error) {
                validationErrors['payment_proof'] = fileResult.error
            }

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors)
                const firstErrorField = Object.keys(validationErrors)[0]
                const el = document.getElementById(firstErrorField)
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                return
            }

            setErrors({})

            // Jalankan Server Action
            startTransition(async () => {
                const res = await registerTeamAction(null, formData)
                setResponse(res)

                if (res.success) {
                    // Reset formulir setelah pendaftaran berhasil
                    formRef.current?.reset()
                    setSelectedFile(null)
                    if (filePreview) {
                        URL.revokeObjectURL(filePreview)
                        setFilePreview(null)
                    }
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                    }
                } else if (res.errors) {
                    setErrors(res.errors)
                }
            })
        },
        [selectedFile, filePreview]
    )

    return {
        isSubmitting,
        response,
        errors,
        selectedFile,
        filePreview,
        formRef,
        fileInputRef,
        handleFileChange,
        removeFile,
        resetSuccessState,
        handleSubmit,
    }
}
