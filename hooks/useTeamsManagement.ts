'use client'

import { useState, useCallback } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useTeamsQuery, useCategoriesQuery } from '@/hooks/useTeamsQuery'
import {
    updateTeamStatusAction,
    getPaymentProofSignedUrlAction,
} from '@/app/admin/(protected)/teams/actions'
import { Team, TeamStatus } from '@/types/domain'

export interface ToastNotification {
    type: 'success' | 'error'
    message: string
}

export function useTeamsManagement() {
    const queryClient = useQueryClient()

    // 1. Filter States
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')

    // 2. Modal & Detail States
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)
    const [signedPaymentUrl, setSignedPaymentUrl] = useState<string | null>(null)
    const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState<boolean>(false)

    // 3. Toast State
    const [toast, setToast] = useState<ToastNotification | null>(null)

    const clearToast = useCallback(() => {
        setToast(null)
    }, [])

    // 4. Queries
    const {
        data: teams = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useTeamsQuery({
        status: statusFilter,
        categoryId: categoryFilter,
    })

    const { data: categories = [] } = useCategoriesQuery()

    // 5. Open Detail Handler with Signed URL Fetch
    const openDetail = useCallback(async (team: Team) => {
        setSelectedTeam(team)
        setIsDetailOpen(true)
        setSignedPaymentUrl(null)

        if (team.payment_proof_url) {
            setIsLoadingSignedUrl(true)
            try {
                const res = await getPaymentProofSignedUrlAction(team.payment_proof_url)
                if (res.success && res.signedUrl) {
                    setSignedPaymentUrl(res.signedUrl)
                } else {
                    setSignedPaymentUrl(null)
                }
            } catch (err) {
                console.error('Error fetching signed URL:', err)
                setSignedPaymentUrl(null)
            } finally {
                setIsLoadingSignedUrl(false)
            }
        }
    }, [])

    const closeDetail = useCallback(() => {
        setIsDetailOpen(false)
        setSelectedTeam(null)
        setSignedPaymentUrl(null)
    }, [])

    // 6. Mutation for Status Update
    const updateMutation = useMutation({
        mutationFn: async ({
            teamId,
            status,
        }: {
            teamId: string
            status: 'confirmed' | 'rejected'
        }) => {
            return await updateTeamStatusAction(teamId, status)
        },
        onSuccess: (res, variables) => {
            if (res.success) {
                // Invalidate cache TanStack Query agar UI update otomatis tanpa reload
                queryClient.invalidateQueries({ queryKey: ['teams'] })

                // Update selected team status jika modal sedang terbuka
                if (selectedTeam && selectedTeam.id === variables.teamId) {
                    setSelectedTeam((prev) =>
                        prev ? { ...prev, status: variables.status as TeamStatus } : null
                    )
                }

                setToast({ type: 'success', message: res.message })
            } else {
                setToast({ type: 'error', message: res.message })
            }
        },
        onError: (err) => {
            setToast({
                type: 'error',
                message:
                    err instanceof Error ? err.message : 'Gagal memperbarui status tim.',
            })
        },
    })

    const updateStatus = useCallback(
        (teamId: string, status: 'confirmed' | 'rejected') => {
            updateMutation.mutate({ teamId, status })
        },
        [updateMutation]
    )

    return {
        // Data & Query States
        teams,
        categories,
        isLoading,
        isError,
        error,
        refetch,

        // Filter Controls
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,

        // Modal Controls
        selectedTeam,
        isDetailOpen,
        signedPaymentUrl,
        isLoadingSignedUrl,
        openDetail,
        closeDetail,

        // Actions & Mutation
        updateStatus,
        isUpdating: updateMutation.isPending,

        // Toast Feedback
        toast,
        clearToast,
    }
}
