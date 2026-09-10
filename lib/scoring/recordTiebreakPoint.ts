import type { MatchTeam, TiebreakState, TiebreakResult } from './types'

/**
 * Calculates point progression in a tiebreak game.
 *
 * Used for:
 * 1. Group stage tiebreak (at 2-2 games): race to 7 with win-by-2 requirement (requireWinBy2 = true).
 * 2. Knockout golden game (at 5-5 games): race to 7 WITHOUT win-by-2 requirement (requireWinBy2 = false).
 */
export function recordTiebreakPoint(
    state: TiebreakState,
    winningTeam: MatchTeam,
    requireWinBy2: boolean
): TiebreakResult {
    const nextPointA = winningTeam === 'team_a' ? state.pointA + 1 : state.pointA
    const nextPointB = winningTeam === 'team_b' ? state.pointB + 1 : state.pointB

    let isGameWon = false
    let winner: MatchTeam | null = null

    if (requireWinBy2) {
        if (nextPointA >= 7 && nextPointA - nextPointB >= 2) {
            isGameWon = true
            winner = 'team_a'
        } else if (nextPointB >= 7 && nextPointB - nextPointA >= 2) {
            isGameWon = true
            winner = 'team_b'
        }
    } else {
        if (nextPointA >= 7) {
            isGameWon = true
            winner = 'team_a'
        } else if (nextPointB >= 7) {
            isGameWon = true
            winner = 'team_b'
        }
    }

    return {
        pointA: nextPointA,
        pointB: nextPointB,
        isGameWon,
        winner,
    }
}
