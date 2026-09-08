'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
    tournamentSettingsSchema,
    TournamentSettingsInput,
} from '@/lib/validations/tournament-settings'
import {
    useTournamentSettingsQuery,
    TOURNAMENT_SETTINGS_QUERY_KEY,
} from '@/hooks/useTournamentSettingsQuery'
import { saveTournamentSettingsAction } from '@/app/admin/(protected)/tournament-setup/actions'
import { TournamentSettings } from '@/types/domain'

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
}

const DEFAULT_FORM_VALUES: TournamentFormValues = {
    name: '',
    team_per_group: 4,
    golden_point_enabled: true,
    third_place_enabled: false,
    number_of_courts: 1,
}

export function useTournamentSettingsForm(initialData?: TournamentSettings | null) {
    const queryClient = useQueryClient()

    // 1. Query data tournament_settings
    const {
        data: settings,
        isLoading: isQueryLoading,
        isError: isQueryError,
        error: queryError,
        refetch,
    } = useTournamentSettingsQuery(initialData)

    // 2. Form state
    const [values, setValues] = useState<TournamentFormValues>(() => {
        const source = initialData || settings
        if (source) {
            return {
                name: source.name || '',
                team_per_group: source.team_per_group ?? 4,
                golden_point_enabled: source.golden_point_enabled ?? true,
                third_place_enabled: source.third_place_enabled ?? false,
                number_of_courts: source.number_of_courts ?? 1,
            }
        }
        return DEFAULT_FORM_VALUES
    })

    // 3. Validation and UI feedback states
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [feedback, setFeedback] = useState<ToastFeedback | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 4. Sinkronisasi form saat data query masuk / berubah
    useEffect(() => {
        if (settings) {
            setValues({
                name: settings.name || '',
                team_per_group: settings.team_per_group ?? 4,
                golden_point_enabled: settings.golden_point_enabled ?? true,
                third_place_enabled: settings.third_place_enabled ?? false,
                number_of_courts: settings.number_of_courts ?? 1,
            })
        }
    }, [settings])

    // 5. Change handlers
    const setFieldValue = useCallback(
        <K extends keyof TournamentFormValues>(field: K, val: TournamentFormValues[K]) => {
            setValues((prev) => ({ ...prev, [field]: val }))
            setFieldErrors((prev) => {
                if (!prev[field]) return prev
                const updated = { ...prev }
                delete updated[field]
                return updated
            })
        },
        []
    )

    const clearFeedback = useCallback(() => {
        setFeedback(null)
    }, [])

    // 6. Submit handler (Client validation -> Server action -> Cache refresh)
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setFeedback(null)
        setFieldErrors({})

        // Client-side validation dengan Zod (fast feedback)
        const validation = tournamentSettingsSchema.safeParse(values)
        if (!validation.success) {
            const errors: Record<string, string> = {}
            for (const issue of validation.error.issues) {
                const key = issue.path[0]?.toString() || 'general'
                errors[key] = issue.message
            }
            setFieldErrors(errors)
            setFeedback({
                type: 'error',
                message: validation.error.issues[0]?.message || 'Periksa kembali isian formulir.',
            })
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
                setFeedback({
                    type: 'error',
                    message: result.message || 'Gagal menyimpan pengaturan turnamen.',
                })
                return
            }

            // Sukses
            setFeedback({
                type: 'success',
                message: result.message || 'Pengaturan turnamen berhasil disimpan.',
            })

            if (result.data) {
                queryClient.setQueryData(TOURNAMENT_SETTINGS_QUERY_KEY, result.data)
            }
            await queryClient.invalidateQueries({ queryKey: TOURNAMENT_SETTINGS_QUERY_KEY })
        } catch (err: unknown) {
            setFeedback({
                type: 'error',
                message:
                    err instanceof Error
                        ? err.message
                        : 'Terjadi kesalahan sistem saat menghubungi server.',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return {
        settings,
        isEditMode: Boolean(settings?.id),
        values,
        fieldErrors,
        feedback,
        clearFeedback,
        isSubmitting,
        isQueryLoading,
        isQueryError,
        queryError,
        refetch,
        setFieldValue,
        handleSubmit,
    }
}
