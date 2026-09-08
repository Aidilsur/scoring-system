'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useActiveCategoriesQuery,
  useCategoryDrawQuery,
  CATEGORY_DRAW_QUERY_KEY,
} from './useDrawQuery'
import { generateCategoryDrawAction } from '@/app/admin/(protected)/draw/actions'
import { TOURNAMENT_SETTINGS_QUERY_KEY } from './useTournamentSettingsQuery'

export interface DrawToast {
  type: 'success' | 'error'
  message: string
}

export function useDrawManagement(initialCategoryId?: string) {
  const queryClient = useQueryClient()

  // 1. Kategori yang dipilih
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategoryId || ''
  )

  // 2. State dialog konfirmasi regenerate
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

  // 3. State notifikasi toast
  const [toast, setToast] = useState<DrawToast | null>(null)

  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  // 4. Query kategori aktif
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
    error: categoriesError,
  } = useActiveCategoriesQuery()

  // Auto-select kategori pertama jika belum ada yang dipilih
  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  // 5. Query data draw per kategori
  const {
    data: drawData,
    isLoading: isLoadingDraw,
    isRefetching: isRefetchingDraw,
    refetch: refetchDraw,
  } = useCategoryDrawQuery(selectedCategoryId)

  // 6. Mutation untuk generate / regenerate draw
  const { mutateAsync: runGenerateDraw, isPending: isGenerating } = useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await generateCategoryDrawAction(categoryId)
      if (!res.success) {
        throw new Error(res.message)
      }
      return res
    },
    onSuccess: (res) => {
      setToast({
        type: 'success',
        message: res.message,
      })
      // Refresh cache query draw dan turnamen
      queryClient.invalidateQueries({
        queryKey: [...CATEGORY_DRAW_QUERY_KEY, selectedCategoryId],
      })
      queryClient.invalidateQueries({
        queryKey: TOURNAMENT_SETTINGS_QUERY_KEY,
      })
    },
    onError: (err: Error) => {
      setToast({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat memproses drawing.',
      })
    },
  })

  // 7. Handler trigger draw (buka modal jika regenerate, langsung eksekusi jika pertama kali)
  const handleTriggerDraw = useCallback(() => {
    if (!selectedCategoryId) {
      setToast({ type: 'error', message: 'Silakan pilih kategori terlebih dahulu.' })
      return
    }

    if (drawData?.hasStartedMatches) {
      setToast({
        type: 'error',
        message:
          'Regenerate draw tidak diizinkan karena pertandingan sudah live atau selesai.',
      })
      return
    }

    if (drawData?.hasExistingDraw) {
      // Buka modal konfirmasi
      setIsConfirmModalOpen(true)
      return
    }

    // Generate pertama kali
    runGenerateDraw(selectedCategoryId)
  }, [selectedCategoryId, drawData, runGenerateDraw])

  // 8. Handler konfirmasi regenerate dari modal
  const handleConfirmRegenerate = useCallback(async () => {
    setIsConfirmModalOpen(false)
    if (!selectedCategoryId) return
    await runGenerateDraw(selectedCategoryId)
  }, [selectedCategoryId, runGenerateDraw])

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return {
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    drawData,
    isLoadingCategories,
    isLoadingDraw,
    isRefetchingDraw,
    refetchDraw,
    isCategoriesError,
    categoriesError,
    isGenerating,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    toast,
    clearToast,
    handleTriggerDraw,
    handleConfirmRegenerate,
  }
}
