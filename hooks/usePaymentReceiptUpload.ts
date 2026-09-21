'use client'

import { useState, useRef, useCallback } from 'react'
import { validatePaymentProofFile } from '@/lib/validations/team-registration'

export interface UsePaymentReceiptUploadReturn {
    selectedFile: File | null
    filePreview: string | null
    fileInputRef: React.RefObject<HTMLInputElement | null>
    fileError: string | null
    clearFileError: () => void
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    removeFile: () => void
    resetUpload: () => void
}

/**
 * Mengelola state upload bukti pembayaran:
 * - Validasi mime type dan ukuran file via validatePaymentProofFile
 * - Membuat object URL preview untuk file gambar
 * - Membersihkan URL object saat file dihapus atau reset
 */
export function usePaymentReceiptUpload(): UsePaymentReceiptUploadReturn {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)
    const [fileError, setFileError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const clearFileError = useCallback(() => setFileError(null), [])

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null
        if (!file) {
            setSelectedFile(null)
            setFilePreview(null)
            return
        }

        const fileCheck = validatePaymentProofFile(file)
        if (!fileCheck.success && fileCheck.error) {
            setFileError(fileCheck.error)
            setSelectedFile(null)
            setFilePreview(null)
            return
        }

        setFileError(null)
        setSelectedFile(file)

        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file)
            setFilePreview(url)
        } else {
            setFilePreview(null)
        }
    }, [])

    const removeFile = useCallback(() => {
        setSelectedFile(null)
        setFileError(null)
        if (filePreview) {
            URL.revokeObjectURL(filePreview)
            setFilePreview(null)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [filePreview])

    const resetUpload = useCallback(() => {
        setSelectedFile(null)
        setFileError(null)
        if (filePreview) {
            URL.revokeObjectURL(filePreview)
        }
        setFilePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }, [filePreview])

    return {
        selectedFile,
        filePreview,
        fileInputRef,
        fileError,
        clearFileError,
        handleFileChange,
        removeFile,
        resetUpload,
    }
}
