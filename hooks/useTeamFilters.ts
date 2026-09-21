'use client'

import { useState, useCallback } from 'react'

export interface TeamFiltersState {
    statusFilter: string
    setStatusFilter: (status: string) => void
    categoryFilter: string
    setCategoryFilter: (category: string) => void
    resetFilters: () => void
}

interface InitialTeamFilters {
    status?: string
    category?: string
}

export function useTeamFilters(initialFilters?: InitialTeamFilters): TeamFiltersState {
    const [statusFilter, setStatusFilter] = useState<string>(
        initialFilters?.status ?? 'all'
    )
    const [categoryFilter, setCategoryFilter] = useState<string>(
        initialFilters?.category ?? 'all'
    )

    const resetFilters = useCallback(() => {
        setStatusFilter('all')
        setCategoryFilter('all')
    }, [])

    return {
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        resetFilters,
    }
}

