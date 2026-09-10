import type { MatchRound } from './types'

/**
 * Checks whether the next game to be played is a tiebreak / golden game rather than a regular game.
 *
 * Rules:
 * - Group stage ('group'): tiebreak game is played when games are tied at 2-2 (deciding 5th game).
 * - Knockout ('semifinal' | 'final' | 'third_place'): golden game is played when games are tied at 5-5 (deciding game).
 */
export function shouldStartTiebreakGame(
    gamesA: number,
    gamesB: number,
    round: MatchRound
): boolean {
    if (round === 'group') {
        return gamesA === 2 && gamesB === 2
    }

    // Knockout rounds: semifinal, final, third_place
    return gamesA === 5 && gamesB === 5
}
