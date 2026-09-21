'use client'

import { useScoringSession } from './useScoringSession'
import { useScoringMutations } from './useScoringMutations'

export function useScoringManagement(
    initialCourtId?: string | null,
    initialMatchId?: string | null,
    initialUserEmail?: string | null
) {
    const {
        selectedCourtId,
        selectedMatchId,
        userEmail,
        servingTeam,
        courtsQuery,
        courtMatchesQuery,
        matchDetailQuery,
        currentMatch,
        selectCourt,
        selectMatch,
        backToMatchList,
        toggleServe,
    } = useScoringSession({
        initialCourtId,
        initialMatchId,
        initialUserEmail,
    })

    const isReadOnly = Boolean(matchDetailQuery.data?.isReadOnly)

    const {
        isPending,
        pendingTeam,
        recordPoint,
        undoPoint,
        releaseControl,
    } = useScoringMutations({
        selectedMatchId,
        selectedCourtId,
        userEmail,
        isReadOnly,
    })

    return {
        // Selection & Session state
        selectedCourtId,
        selectedMatchId,
        userEmail,
        servingTeam,
        isPending,
        pendingTeam,

        // Data
        courts: courtsQuery.data || [],
        isCourtsLoading: courtsQuery.isLoading,

        courtMatches: courtMatchesQuery.data?.matches || [],
        currentCourtMatch: courtMatchesQuery.data?.currentMatch || null,
        isMatchesLoading: courtMatchesQuery.isLoading,

        currentMatch,
        canUndo: Boolean(matchDetailQuery.data?.canUndo),
        isReadOnly,
        isClaimedByOther: Boolean(matchDetailQuery.data?.isClaimedByOther),
        historyCount: matchDetailQuery.data?.historyCount || 0,
        isMatchLoading: matchDetailQuery.isLoading,

        selectCourt,
        selectMatch,
        backToMatchList,
        toggleServe,
        recordPoint,
        undoPoint,
        releaseControl,
    }
}
