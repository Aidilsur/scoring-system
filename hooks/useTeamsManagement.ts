'use client'

import { useState, useCallback } from 'react'
import { useTeamsQuery, useCategoriesQuery } from '@/hooks/useTeamsQuery'
import { getPaymentProofSignedUrlAction } from '@/app/admin/(protected)/teams/actions'
import { Team } from '@/types/domain'
import { useTeamFilters } from '@/hooks/useTeamFilters'
import { useTeamMutations, ToastNotification } from '@/hooks/useTeamMutations'

export type { ToastNotification }

/**
 * useTeamsManagement (Thin Composer)
 * Menggabungkan useTeamFilters, useTeamMutations, data queries, dan state modal detail.
 * Sesuai docs/component-architecture.md §E dan §K.
 */
export function useTeamsManagement() {
    // 1. Filter States
    const {
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        resetFilters,
    } = useTeamFilters()

    // 2. Modal & Detail States
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false)
    const [signedPaymentUrl, setSignedPaymentUrl] = useState<string | null>(null)
    const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState<boolean>(false)

    const closeDetail = useCallback(() => {
        setIsDetailOpen(false)
        setSelectedTeam(null)
        setSignedPaymentUrl(null)
    }, [])

    // 3. Mutations
    const {
        updateStatus,
        approveTeam,
        rejectTeam,
        isUpdating,
        toast,
        clearToast,
    } = useTeamMutations({
        onStatusUpdated: (teamId, newStatus) => {
            if (selectedTeam && selectedTeam.id === teamId) {
                setSelectedTeam((prev) =>
                    prev ? { ...prev, status: newStatus } : null
                )
            }
        },
    })

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

    // 5. Detail Modal Handlers
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
        resetFilters,

        // Modal Controls
        selectedTeam,
        isDetailOpen,
        signedPaymentUrl,
        isLoadingSignedUrl,
        openDetail,
        closeDetail,

        // Actions & Mutation
        updateStatus,
        approveTeam,
        rejectTeam,
        isUpdating,

        // Toast Feedback
        toast,
        clearToast,
    }
}

