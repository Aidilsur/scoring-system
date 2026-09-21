'use client'

import { useState, useCallback, useTransition } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
    recordPointAction,
    undoLastPointAction,
    releaseScorerSessionAction,
} from '@/app/admin/(protected)/scoring/actions'
import { matchDetailQueryKey, type MatchDetailData } from './useMatchDetailQuery'
import { courtMatchesQueryKey } from './useCourtMatchesQuery'
import { toast } from '@/lib/toast'
import type { MatchTeam } from '@/lib/scoring'
import type { Match } from '@/types/domain'

interface UseScoringMutationsOptions {
    selectedMatchId: string | null
    selectedCourtId: string | null
    userEmail: string | null
    isReadOnly: boolean
}

export function useScoringMutations({
    selectedMatchId,
    selectedCourtId,
    userEmail,
    isReadOnly,
}: UseScoringMutationsOptions) {
    const queryClient = useQueryClient()
    const [isPending, startTransition] = useTransition()
    const [pendingTeam, setPendingTeam] = useState<MatchTeam | null>(null)

    const recordPoint = useCallback(
        (winningTeam: MatchTeam) => {
            if (!selectedMatchId || isPending) return
            if (isReadOnly) return

            setPendingTeam(winningTeam)
            startTransition(async () => {
                try {
                    const result = await recordPointAction(
                        selectedMatchId,
                        winningTeam,
                        userEmail || undefined
                    )

                    if (!result.success) {
                        toast.error(result.message)
                        await queryClient.invalidateQueries({
                            queryKey: matchDetailQueryKey(selectedMatchId),
                        })
                        return
                    }

                    if (result.data?.status === 'completed') {
                        toast.success('Pertandingan selesai!', result.message)
                    }

                    if (result.data) {
                        queryClient.setQueryData(
                            matchDetailQueryKey(selectedMatchId, userEmail || undefined),
                            (old: unknown) => {
                                const oldData = old as MatchDetailData | undefined
                                if (!oldData) return oldData
                                return {
                                    ...oldData,
                                    match: result.data as Match,
                                    historyCount: (oldData.historyCount || 0) + 1,
                                    canUndo: true,
                                }
                            }
                        )
                    }

                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) }),
                        queryClient.invalidateQueries({ queryKey: courtMatchesQueryKey(selectedCourtId!) }),
                    ])
                } catch (err: unknown) {
                    const errorMsg = err instanceof Error ? err.message : 'Gagal mencatat poin.'
                    toast.error(errorMsg)
                    await queryClient.invalidateQueries({
                        queryKey: matchDetailQueryKey(selectedMatchId),
                    })
                } finally {
                    setPendingTeam(null)
                }
            })
        },
        [selectedMatchId, selectedCourtId, userEmail, isReadOnly, isPending, queryClient]
    )

    const undoPoint = useCallback(() => {
        if (!selectedMatchId || isPending) return

        startTransition(async () => {
            try {
                const result = await undoLastPointAction(selectedMatchId, userEmail || undefined)

                if (!result.success) {
                    toast.error(result.message)
                    queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) })
                    return
                }

                toast.success(result.message)

                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) }),
                    queryClient.invalidateQueries({ queryKey: courtMatchesQueryKey(selectedCourtId!) }),
                ])
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : 'Gagal melakukan undo poin.'
                toast.error(errorMsg)
            }
        })
    }, [selectedMatchId, selectedCourtId, userEmail, isPending, queryClient])

    const releaseControl = useCallback(async (): Promise<boolean> => {
        if (!selectedMatchId) return false
        if (isReadOnly) return false

        try {
            const result = await releaseScorerSessionAction(selectedMatchId, userEmail || undefined)
            if (result.success) {
                toast.info(result.message)
            } else {
                toast.error(result.message)
            }

            await Promise.all([
                queryClient.invalidateQueries({ queryKey: matchDetailQueryKey(selectedMatchId) }),
                queryClient.invalidateQueries({ queryKey: courtMatchesQueryKey(selectedCourtId!) }),
            ])

            return result.success
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Gagal melepas kendali scoring.'
            toast.error(errorMsg)
            return false
        }
    }, [selectedMatchId, selectedCourtId, userEmail, isReadOnly, queryClient])

    return {
        isPending,
        pendingTeam,
        recordPoint,
        undoPoint,
        releaseControl,
    }
}
