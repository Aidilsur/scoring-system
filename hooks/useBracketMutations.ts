'use client'

import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CATEGORY_BRACKET_QUERY_KEY } from './useBracketQuery'
import {
    generateBracketAction,
    resetBracketAction,
    generateFinalAction,
    resetFinalAction,
} from '@/app/admin/(protected)/bracket/actions'
import { toast } from '@/lib/toast'

interface UseBracketMutationsOptions {
    selectedCategoryId: string
}

export function useBracketMutations({ selectedCategoryId }: UseBracketMutationsOptions) {
    const queryClient = useQueryClient()

    const invalidateBracketQuery = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: [...CATEGORY_BRACKET_QUERY_KEY, selectedCategoryId],
        })
    }, [queryClient, selectedCategoryId])

    // 1. Mutation Generate Semifinal Bracket
    const { mutateAsync: runGenerateBracket, isPending: isGenerating } = useMutation({
        mutationFn: async (categoryId: string) => {
            const res = await generateBracketAction(categoryId)
            if (!res.success) {
                throw new Error(res.message)
            }
            return res
        },
        onSuccess: (res) => {
            toast.success(res.message)
            invalidateBracketQuery()
        },
        onError: (err: Error) => {
            const errMsg = err.message || 'Gagal membuat pasangan bracket semifinal.'
            toast.error(errMsg)
        },
    })

    // 2. Mutation Reset Semifinal Bracket
    const { mutateAsync: runResetBracket, isPending: isResetting } = useMutation({
        mutationFn: async (categoryId: string) => {
            const res = await resetBracketAction(categoryId)
            if (!res.success) {
                throw new Error(res.message)
            }
            return res
        },
        onSuccess: (res) => {
            toast.success(res.message)
            invalidateBracketQuery()
        },
        onError: (err: Error) => {
            const errMsg = err.message || 'Gagal mereset pasangan bracket.'
            toast.error(errMsg)
        },
    })

    // 3. Mutation Generate Final & Third Place
    const { mutateAsync: runGenerateFinal, isPending: isGeneratingFinal } = useMutation({
        mutationFn: async (categoryId: string) => {
            const res = await generateFinalAction(categoryId)
            if (!res.success) {
                throw new Error(res.message)
            }
            return res
        },
        onSuccess: (res) => {
            toast.success(res.message)
            invalidateBracketQuery()
        },
        onError: (err: Error) => {
            const errMsg = err.message || 'Gagal membuat pasangan babak final.'
            toast.error(errMsg)
        },
    })

    // 4. Mutation Reset Final & Third Place
    const { mutateAsync: runResetFinal, isPending: isResettingFinal } = useMutation({
        mutationFn: async (categoryId: string) => {
            const res = await resetFinalAction(categoryId)
            if (!res.success) {
                throw new Error(res.message)
            }
            return res
        },
        onSuccess: (res) => {
            toast.success(res.message)
            invalidateBracketQuery()
        },
        onError: (err: Error) => {
            const errMsg = err.message || 'Gagal mereset pasangan final.'
            toast.error(errMsg)
        },
    })

    const handleGenerateBracket = useCallback(async () => {
        if (!selectedCategoryId) {
            toast.error('Silakan pilih kategori terlebih dahulu.')
            return
        }
        try {
            await runGenerateBracket(selectedCategoryId)
        } catch {
            // Error ditangani di onError mutation
        }
    }, [selectedCategoryId, runGenerateBracket])

    const handleResetBracket = useCallback(async () => {
        if (!selectedCategoryId) {
            toast.error('Silakan pilih kategori terlebih dahulu.')
            return
        }
        try {
            await runResetBracket(selectedCategoryId)
        } catch {
            // Error ditangani di onError mutation
        }
    }, [selectedCategoryId, runResetBracket])

    const handleGenerateFinal = useCallback(async () => {
        if (!selectedCategoryId) {
            toast.error('Silakan pilih kategori terlebih dahulu.')
            return
        }
        try {
            await runGenerateFinal(selectedCategoryId)
        } catch {
            // Error ditangani di onError mutation
        }
    }, [selectedCategoryId, runGenerateFinal])

    const handleResetFinal = useCallback(async () => {
        if (!selectedCategoryId) {
            toast.error('Silakan pilih kategori terlebih dahulu.')
            return
        }
        try {
            await runResetFinal(selectedCategoryId)
        } catch {
            // Error ditangani di onError mutation
        }
    }, [selectedCategoryId, runResetFinal])

    return {
        handleGenerateBracket,
        handleResetBracket,
        handleGenerateFinal,
        handleResetFinal,
        isGenerating,
        isResetting,
        isGeneratingFinal,
        isResettingFinal,
    }
}
