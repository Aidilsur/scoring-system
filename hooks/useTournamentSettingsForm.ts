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
}

const DEFAULT_FORM_VALUES: TournamentFormValues = {
    name: '',
    team_per_group: 4,
    golden_point_enabled: true,
    third_place_enabled: false,
    number_of_courts: 1,
    match_duration_minutes: 45,
    daily_start_time: '08:00',
    daily_end_time: '18:00',
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
                match_duration_minutes: source.match_duration_minutes ?? 45,
                daily_start_time: source.daily_start_time ? source.daily_start_time.slice(0, 5) : '08:00',
                daily_end_time: source.daily_end_time ? source.daily_end_time.slice(0, 5) : '18:00',
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
                match_duration_minutes: settings.match_duration_minutes ?? 45,
                daily_start_time: settings.daily_start_time ? settings.daily_start_time.slice(0, 5) : '08:00',
                daily_end_time: settings.daily_end_time ? settings.daily_end_time.slice(0, 5) : '18:00',
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
            const errorMsg = validation.error.issues[0]?.message || 'Periksa kembali isian formulir.'
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
                const errorMsg = result.message || 'Gagal menyimpan pengaturan turnamen.'
                setFeedback({
                    type: 'error',
                    message: errorMsg,
                })
                toast.error(errorMsg)

                // Otomatis re-fetch & reset form field ke nilai asli yang tersimpan di database
                let rollbackData = result.data
                if (!rollbackData) {
                    const latest = await refetch()
                    rollbackData = latest.data || settings || undefined
                }

                if (rollbackData) {
                    setValues({
                        name: rollbackData.name || '',
                        team_per_group: rollbackData.team_per_group ?? 4,
                        golden_point_enabled: rollbackData.golden_point_enabled ?? true,
                        third_place_enabled: rollbackData.third_place_enabled ?? false,
                        number_of_courts: rollbackData.number_of_courts ?? 1,
                        match_duration_minutes: rollbackData.match_duration_minutes ?? 45,
                        daily_start_time: rollbackData.daily_start_time ? rollbackData.daily_start_time.slice(0, 5) : '08:00',
                        daily_end_time: rollbackData.daily_end_time ? rollbackData.daily_end_time.slice(0, 5) : '18:00',
                    })
                    queryClient.setQueryData(TOURNAMENT_SETTINGS_QUERY_KEY, rollbackData)
                }
                await queryClient.invalidateQueries({ queryKey: TOURNAMENT_SETTINGS_QUERY_KEY })
                return
            }

            // Sukses
            const successMsg = result.message || 'Pengaturan turnamen berhasil disimpan.'
            setFeedback({
                type: 'success',
                message: successMsg,
            })
            toast.success(successMsg)

            if (result.warning) {
                toast.warning(result.warning)
            }

            if (result.data) {
                setValues({
                    name: result.data.name || '',
                    team_per_group: result.data.team_per_group ?? 4,
                    golden_point_enabled: result.data.golden_point_enabled ?? true,
                    third_place_enabled: result.data.third_place_enabled ?? false,
                    number_of_courts: result.data.number_of_courts ?? 1,
                    match_duration_minutes: result.data.match_duration_minutes ?? 45,
                    daily_start_time: result.data.daily_start_time ? result.data.daily_start_time.slice(0, 5) : '08:00',
                    daily_end_time: result.data.daily_end_time ? result.data.daily_end_time.slice(0, 5) : '18:00',
                })
                queryClient.setQueryData(TOURNAMENT_SETTINGS_QUERY_KEY, result.data)
            }
            await queryClient.invalidateQueries({ queryKey: TOURNAMENT_SETTINGS_QUERY_KEY })
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
                setValues({
                    name: rollbackData.name || '',
                    team_per_group: rollbackData.team_per_group ?? 4,
                    golden_point_enabled: rollbackData.golden_point_enabled ?? true,
                    third_place_enabled: rollbackData.third_place_enabled ?? false,
                    number_of_courts: rollbackData.number_of_courts ?? 1,
                    match_duration_minutes: rollbackData.match_duration_minutes ?? 45,
                    daily_start_time: rollbackData.daily_start_time ? rollbackData.daily_start_time.slice(0, 5) : '08:00',
                    daily_end_time: rollbackData.daily_end_time ? rollbackData.daily_end_time.slice(0, 5) : '18:00',
                })
                queryClient.setQueryData(TOURNAMENT_SETTINGS_QUERY_KEY, rollbackData)
            }
            await queryClient.invalidateQueries({ queryKey: TOURNAMENT_SETTINGS_QUERY_KEY })
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
