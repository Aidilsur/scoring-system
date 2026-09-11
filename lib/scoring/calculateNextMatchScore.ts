import { recordPoint } from './recordPoint'
import { recordTiebreakPoint } from './recordTiebreakPoint'
import { shouldStartTiebreakGame } from './shouldStartTiebreakGame'
import { checkMatchWinner } from './checkMatchWinner'
import type { MatchTeam, RegularPoint } from './types'
import type { Match, MatchRound, MatchStatus } from '@/types/domain'

/**
 * Pure function to calculate the next state of a match score optimistically on the client.
 * Uses the exact same scoring logic as the server action recordPointAction.
 */
export function calculateNextMatchScore(
    currentMatch: Match,
    winningTeam: MatchTeam,
    goldenPointEnabled: boolean = true
): Match {
    if (currentMatch.status === 'completed') {
        return currentMatch
    }

    const round = currentMatch.round as MatchRound
    const isTiebreak = shouldStartTiebreakGame(
        currentMatch.games_team_a,
        currentMatch.games_team_b,
        round
    )

    let finalPointA: string = '0'
    let finalPointB: string = '0'
    let finalGamesA: number = currentMatch.games_team_a
    let finalGamesB: number = currentMatch.games_team_b
    let finalStatus: MatchStatus = currentMatch.status as MatchStatus
    let finalWinnerId: string | null = currentMatch.winner_team_id || null
    let finalCompletedAt: string | null = currentMatch.completed_at || null

    if (isTiebreak) {
        // Tiebreak / Golden Game logic
        const requireWinBy2 = round === 'group'
        const currentPointANum = parseInt(currentMatch.current_point_a || '0', 10) || 0
        const currentPointBNum = parseInt(currentMatch.current_point_b || '0', 10) || 0

        const tiebreakResult = recordTiebreakPoint(
            { pointA: currentPointANum, pointB: currentPointBNum },
            winningTeam,
            requireWinBy2
        )

        if (tiebreakResult.isGameWon) {
            if (tiebreakResult.winner === 'team_a') {
                finalGamesA += 1
            } else {
                finalGamesB += 1
            }
            finalPointA = '0'
            finalPointB = '0'

            const matchWinner = checkMatchWinner(finalGamesA, finalGamesB, round)
            if (matchWinner) {
                finalStatus = 'completed'
                finalWinnerId = matchWinner === 'team_a' ? currentMatch.team_a_id : currentMatch.team_b_id
                finalCompletedAt = new Date().toISOString()
            }
        } else {
            finalPointA = tiebreakResult.pointA.toString()
            finalPointB = tiebreakResult.pointB.toString()
        }
    } else {
        // Regular Game logic
        const regularResult = recordPoint(
            {
                pointA: (currentMatch.current_point_a || '0') as RegularPoint,
                pointB: (currentMatch.current_point_b || '0') as RegularPoint,
                goldenPointEnabled,
            },
            winningTeam
        )

        if (regularResult.isGameWon) {
            if (regularResult.winner === 'team_a') {
                finalGamesA += 1
            } else {
                finalGamesB += 1
            }
            finalPointA = '0'
            finalPointB = '0'

            const matchWinner = checkMatchWinner(finalGamesA, finalGamesB, round)
            if (matchWinner) {
                finalStatus = 'completed'
                finalWinnerId = matchWinner === 'team_a' ? currentMatch.team_a_id : currentMatch.team_b_id
                finalCompletedAt = new Date().toISOString()
            }
        } else {
            finalPointA = regularResult.pointA
            finalPointB = regularResult.pointB
        }
    }

    if (finalStatus === 'scheduled') {
        finalStatus = 'live'
    }

    return {
        ...currentMatch,
        current_point_a: finalPointA,
        current_point_b: finalPointB,
        games_team_a: finalGamesA,
        games_team_b: finalGamesB,
        status: finalStatus,
        winner_team_id: finalWinnerId,
        completed_at: finalCompletedAt,
    }
}
