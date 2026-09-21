'use client'

import { useState, useCallback } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { updateTeamStatusAction } from '@/app/admin/(protected)/teams/actions'
import { TeamStatus } from '@/types/domain'
import { showToast } from '@/lib/toast'

export interface ToastNotification {
    type: 'success' | 'error'
    message: string
}

interface UseTeamMutationsOptions {
    onStatusUpdated?: (teamId: string, status: TeamStatus) => void
}

export function useTeamMutations(options?: UseTeamMutationsOptions) {
    const queryClient = useQueryClient()
    const [toast, setToast] = useState<ToastNotification | null>(null)

    const clearToast = useCallback(() => {
        setToast(null)
    }, [])

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
                queryClient.invalidateQueries({ queryKey: ['teams'] })
                options?.onStatusUpdated?.(
                    variables.teamId,
                    variables.status as TeamStatus
                )
                setToast({ type: 'success', message: res.message })
                showToast.success(res.message)
            } else {
                setToast({ type: 'error', message: res.message })
                showToast.error(res.message)
            }
        },
        onError: (err) => {
            const errMsg =
                err instanceof Error ? err.message : 'Gagal memperbarui status tim.'
            setToast({ type: 'error', message: errMsg })
            showToast.error(errMsg)
        },
    })

    const updateStatus = useCallback(
        (teamId: string, status: 'confirmed' | 'rejected') => {
            updateMutation.mutate({ teamId, status })
        },
        [updateMutation]
    )

    const approveTeam = useCallback(
        (teamId: string) => {
            updateStatus(teamId, 'confirmed')
        },
        [updateStatus]
    )

    const rejectTeam = useCallback(
        (teamId: string) => {
            updateStatus(teamId, 'rejected')
        },
        [updateStatus]
    )

    return {
        updateStatus,
        approveTeam,
        rejectTeam,
        isUpdating: updateMutation.isPending,
        toast,
        clearToast,
    }
}

