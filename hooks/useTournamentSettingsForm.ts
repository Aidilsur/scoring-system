'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    useTournamentSettingsQuery,
} from '@/hooks/useTournamentSettingsQuery'
import { TournamentSettings } from '@/types/domain'
import {
    useTournamentSettingsMutations,
    mapSettingsToFormValues,
    TournamentFormValues,
    ToastFeedback,
} from './useTournamentSettingsMutations'

export type { TournamentFormValues, ToastFeedback }

export const DEFAULT_FORM_VALUES: TournamentFormValues = {
    name: '',
    team_per_group: 4,
    golden_point_enabled: true,
    third_place_enabled: false,
    number_of_courts: 1,
    match_duration_minutes: 45,
    daily_start_time: '08:00',
    daily_end_time: '18:00',
    event_date: '',
    venue_name: '',
    venue_address: '',
}

/**
 * useTournamentSettingsForm
 * Thin composer hook yang meng-orchestrate:
 * 1. Data querying & cache status (useTournamentSettingsQuery)
 * 2. Form state management (values, fieldErrors, setFieldValue, sync)
 * 3. Data mutation & auto-rollback (useTournamentSettingsMutations)
 *
 * Mematuhi docs/component-architecture.md §K.
 */
export function useTournamentSettingsForm(initialData?: TournamentSettings | null) {
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
            return mapSettingsToFormValues(source)
        }
        return DEFAULT_FORM_VALUES
    })

    // 3. Validation errors state
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    // 4. Sinkronisasi form saat data query masuk / berubah
    useEffect(() => {
        if (settings) {
            setValues(mapSettingsToFormValues(settings))
        }
    }, [settings])

    // 5. Change handler
    const setFieldValue = useCallback(
        <K extends keyof TournamentFormValues>(
            field: K,
            val: TournamentFormValues[K]
        ) => {
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

    // 6. Mutations hook
    const {
        feedback,
        clearFeedback,
        isSubmitting,
        handleSubmit,
    } = useTournamentSettingsMutations({
        values,
        setValues,
        setFieldErrors,
        settings,
        refetch,
    })

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
