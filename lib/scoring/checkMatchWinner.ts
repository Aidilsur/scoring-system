import type { MatchRound, MatchTeam } from './types'

/**
 * Determines if a match has been won based on current games won and round type.
 *
 * Rules:
 * - Group stage ('group'): Best of 5 games -> First to reach 3 games wins.
 * - Knockout ('semifinal' | 'final' | 'third_place'): First to reach 6 games wins.
 *
 * Returns 'team_a' | 'team_b' if a team has met the victory condition, or null if ongoing.
 */
export function checkMatchWinner(
    gamesA: number,
    gamesB: number,
    round: MatchRound
): MatchTeam | null {
    if (round === 'group') {
        if (gamesA >= 3) return 'team_a'
        if (gamesB >= 3) return 'team_b'
        return null
    }

    // Knockout rounds: semifinal, final, third_place
    if (gamesA >= 6) return 'team_a'
    if (gamesB >= 6) return 'team_b'
    return null
}
