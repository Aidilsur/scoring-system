'use client'

import { useState, useCallback, FormEvent } from 'react'
import { useQueryClient, QueryObserverResult } from '@tanstack/react-query'
import { tournamentSettingsSchema } from '@/lib/validations/tournament-settings'
import { TOURNAMENT_SETTINGS_QUERY_KEY } from '@/hooks/useTournamentSettingsQuery'
import { saveTournamentSettingsAction } from '@/app/admin/(protected)/tournament-setup/actions'
import { TournamentSettings } from '@/types/domain'
import { toast } from '@/lib/toast'

export interface ToastFeedback {
    type: 'success' | 'error'
    message: string
}

export interface TournamentFormValues {
    name: string
    team_per_group: number
    golden_point_enabled: boolean
    third_place_enabled: boolean
    number_of_courts: number
    match_duration_minutes: number
    daily_start_time: string
    daily_end_time: string
    event_date: string
    venue_name: string
    venue_address: string
}

export interface UseTournamentSettingsMutationsOptions {
    values: TournamentFormValues
    setValues: React.Dispatch<React.SetStateAction<TournamentFormValues>>
    setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
    settings?: TournamentSettings | null
    refetch: () => Promise<QueryObserverResult<TournamentSettings | null, Error>>
}

export function mapSettingsToFormValues(data: TournamentSettings): TournamentFormValues {
    return {
        name: data.name || '',
        team_per_group: data.team_per_group ?? 4,
        golden_point_enabled: data.golden_point_enabled ?? true,
        third_place_enabled: data.third_place_enabled ?? false,
        number_of_courts: data.number_of_courts ?? 1,
        match_duration_minutes: data.match_duration_minutes ?? 45,
        daily_start_time: data.daily_start_time
            ? data.daily_start_time.slice(0, 5)
            : '08:00',
        daily_end_time: data.daily_end_time
            ? data.daily_end_time.slice(0, 5)
            : '18:00',
        event_date: data.event_date || '',
        venue_name: data.venue_name || '',
        venue_address: data.venue_address || '',
    }
}

/**
 * useTournamentSettingsMutations
 * Mengelola eksekusi mutasi penyimpanan pengaturan turnamen, validasi Zod,
 * sinkronisasi query cache, rollback otomatis saat gagal, dan feedback notifikasi.
 * Mematuhi docs/component-architecture.md §K.
 */
export function useTournamentSettingsMutations({
    values,
    setValues,
    setFieldErrors,
    settings,
    refetch,
}: UseTournamentSettingsMutationsOptions) {
    const queryClient = useQueryClient()
    const [feedback, setFeedback] = useState<ToastFeedback | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const clearFeedback = useCallback(() => {
        setFeedback(null)
    }, [])

    const handleSubmit = useCallback(
        async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            setFeedback(null)
            setFieldErrors({})

            // Client-side validation dengan Zod
            const validation = tournamentSettingsSchema.safeParse(values)
            if (!validation.success) {
                const errors: Record<string, string> = {}
                for (const issue of validation.error.issues) {
                    const key = issue.path[0]?.toString() || 'general'
                    errors[key] = issue.message
                }
                setFieldErrors(errors)
                const errorMsg =
                    validation.error.issues[0]?.message || 'Periksa kembali isian formulir.'
                setFeedback({
                    type: 'error',
                    message: errorMsg,
                })
                toast.error(errorMsg)
                return
            }

            setIsSubmitting(true)

            try {
                const result = await saveTournamentSettingsAction(
                    validation.data,
                    settings?.id
                )

                if (!result.success) {
                    if (result.errors) {
                        setFieldErrors(result.errors)
                    }
                    const errorMsg =
                        result.message || 'Gagal menyimpan pengaturan turnamen.'
                    setFeedback({
                        type: 'error',
                        message: errorMsg,
                    })
                    toast.error(errorMsg)

                    // Otomatis re-fetch & rollback form ke nilai asli di database
                    let rollbackData = result.data
                    if (!rollbackData) {
                        const latest = await refetch()
                        rollbackData = latest.data || settings || undefined
                    }

                    if (rollbackData) {
                        setValues(mapSettingsToFormValues(rollbackData))
                        queryClient.setQueryData(
                            TOURNAMENT_SETTINGS_QUERY_KEY,
                            rollbackData
                        )
                    }
                    await queryClient.invalidateQueries({
                        queryKey: TOURNAMENT_SETTINGS_QUERY_KEY,
                    })
                    return
                }

                // Sukses
                const successMsg =
                    result.message || 'Pengaturan turnamen berhasil disimpan.'
                setFeedback({
                    type: 'success',
                    message: successMsg,
                })
                toast.success(successMsg)

                if (result.warning) {
                    toast.warning(result.warning)
                }

                if (result.data) {
                    setValues(mapSettingsToFormValues(result.data))
                    queryClient.setQueryData(
                        TOURNAMENT_SETTINGS_QUERY_KEY,
                        result.data
                    )
                }
                await queryClient.invalidateQueries({
                    queryKey: TOURNAMENT_SETTINGS_QUERY_KEY,
                })
            } catch (err: unknown) {
                const errorMsg =
                    err instanceof Error
                        ? err.message
                        : 'Terjadi kesalahan sistem saat menghubungi server.'
                setFeedback({
                    type: 'error',
                    message: errorMsg,
                })
                toast.error(errorMsg)

                // Re-fetch dan reset form jika server/network error
                const latest = await refetch()
                const rollbackData = latest.data || settings || null
                if (rollbackData) {
                    setValues(mapSettingsToFormValues(rollbackData))
                    queryClient.setQueryData(
                        TOURNAMENT_SETTINGS_QUERY_KEY,
                        rollbackData
                    )
                }
                await queryClient.invalidateQueries({
                    queryKey: TOURNAMENT_SETTINGS_QUERY_KEY,
                })
            } finally {
                setIsSubmitting(false)
            }
        },
        [values, settings, refetch, queryClient, setValues, setFieldErrors]
    )

    return {
        feedback,
        clearFeedback,
        isSubmitting,
        handleSubmit,
    }
}
