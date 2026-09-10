import type { MatchTeam, RegularGameState, RegularGameResult } from './types'

/**
 * Calculates point progression in a single regular game (0 -> 15 -> 30 -> 40 -> Game).
 * Supports golden point (sudden death at 40-40) and standard advantage (AD).
 *
 * When a game is won, isGameWon is true, winner indicates the winning team,
 * and pointA/pointB are reset to '0'.
 */
export function recordPoint(
    state: RegularGameState,
    winningTeam: MatchTeam
): RegularGameResult {
    const { pointA, pointB, goldenPointEnabled } = state

    if (winningTeam === 'team_a') {
        if (pointA === '0') {
            return { pointA: '15', pointB, isGameWon: false, winner: null }
        }
        if (pointA === '15') {
            return { pointA: '30', pointB, isGameWon: false, winner: null }
        }
        if (pointA === '30') {
            return { pointA: '40', pointB, isGameWon: false, winner: null }
        }
        if (pointA === '40') {
            // Deuce scenario
            if (pointB === '40') {
                if (goldenPointEnabled) {
                    return { pointA: '0', pointB: '0', isGameWon: true, winner: 'team_a' }
                }
                return { pointA: 'AD', pointB: '40', isGameWon: false, winner: null }
            }
            // Opponent had advantage: back to deuce 40-40
            if (pointB === 'AD') {
                return { pointA: '40', pointB: '40', isGameWon: false, winner: null }
            }
            // Regular game won (pointB is 0, 15, or 30)
            return { pointA: '0', pointB: '0', isGameWon: true, winner: 'team_a' }
        }
        if (pointA === 'AD') {
            return { pointA: '0', pointB: '0', isGameWon: true, winner: 'team_a' }
        }
    } else {
        if (pointB === '0') {
            return { pointA, pointB: '15', isGameWon: false, winner: null }
        }
        if (pointB === '15') {
            return { pointA, pointB: '30', isGameWon: false, winner: null }
        }
        if (pointB === '30') {
            return { pointA, pointB: '40', isGameWon: false, winner: null }
        }
        if (pointB === '40') {
            // Deuce scenario
            if (pointA === '40') {
                if (goldenPointEnabled) {
                    return { pointA: '0', pointB: '0', isGameWon: true, winner: 'team_b' }
                }
                return { pointA: '40', pointB: 'AD', isGameWon: false, winner: null }
            }
            // Opponent had advantage: back to deuce 40-40
            if (pointA === 'AD') {
                return { pointA: '40', pointB: '40', isGameWon: false, winner: null }
            }
            // Regular game won (pointA is 0, 15, or 30)
            return { pointA: '0', pointB: '0', isGameWon: true, winner: 'team_b' }
        }
        if (pointB === 'AD') {
            return { pointA: '0', pointB: '0', isGameWon: true, winner: 'team_b' }
        }
    }

    return {
        pointA,
        pointB,
        isGameWon: false,
        winner: null,
    }
}
