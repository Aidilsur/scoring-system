'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    useCategoriesWithGroupsQuery,
    useCategoryBracketQuery,
    CATEGORY_BRACKET_QUERY_KEY,
} from './useBracketQuery'
import {
    generateBracketAction,
    resetBracketAction,
    generateFinalAction,
    resetFinalAction,
} from '@/app/admin/(protected)/bracket/actions'
import { toast } from '@/lib/toast'

export function useBracketManagement(initialCategoryId?: string) {
    const queryClient = useQueryClient()

    // 1. Kategori yang dipilih
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
        initialCategoryId || ''
    )

    // 2. Query kategori yang sudah punya grup
    const {
        data: categories = [],
        isLoading: isLoadingCategories,
    } = useCategoriesWithGroupsQuery()

    // Otomatis pilih kategori pertama jika belum ada yang dipilih
    useEffect(() => {
        if (!selectedCategoryId && categories.length > 0) {
            setSelectedCategoryId(categories[0].id)
        }
    }, [categories, selectedCategoryId])

    // 3. Query data bracket untuk kategori terpilih
    const {
        data: bracketData,
        isLoading: isLoadingBracket,
        isRefetching: isRefetchingBracket,
        refetch: refetchBracket,
    } = useCategoryBracketQuery(selectedCategoryId)

    // 4. Mutation Generate Semifinal Bracket
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
            queryClient.invalidateQueries({
                queryKey: [...CATEGORY_BRACKET_QUERY_KEY, selectedCategoryId],
            })
        },
        onError: (err: Error) => {
            const errMsg = err.message || 'Gagal membuat pasangan bracket semifinal.'
            toast.error(errMsg)
        },
    })

    // 5. Mutation Reset Semifinal Bracket
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
            queryClient.invalidateQueries({
                queryKey: [...CATEGORY_BRACKET_QUERY_KEY, selectedCategoryId],
            })
        },
        onError: (err: Error) => {
            const errMsg = err.message || 'Gagal mereset pasangan bracket.'
            toast.error(errMsg)
        },
    })

    // 6. Mutation Generate Final & Third Place
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
            queryClient.invalidateQueries({
                queryKey: [...CATEGORY_BRACKET_QUERY_KEY, selectedCategoryId],
            })
        },
        onError: (err: Error) => {
            const errMsg = err.message || 'Gagal membuat pasangan babak final.'
            toast.error(errMsg)
        },
    })

    // 7. Mutation Reset Final & Third Place
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
            queryClient.invalidateQueries({
                queryKey: [...CATEGORY_BRACKET_QUERY_KEY, selectedCategoryId],
            })
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
        categories,
        isLoadingCategories,
        selectedCategoryId,
        setSelectedCategoryId,
        bracketData,
        isLoadingBracket,
        isRefetchingBracket,
        refetchBracket,
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
