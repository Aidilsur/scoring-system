export interface SemifinalMatchForFinalPairing {
    team_a_id?: string | null
    team_b_id?: string | null
    winner_team_id?: string | null
    teamAId?: string | null
    teamBId?: string | null
    winnerTeamId?: string | null
    status?: string | null
    round?: string | null
    [key: string]: unknown
}

export interface PairingTeamSlot {
    teamAId: string
    teamBId: string
}

export interface FinalPairingResult {
    final: PairingTeamSlot
    thirdPlace: PairingTeamSlot | null
}

function getTeamId(val: unknown): string | null {
    if (!val) return null
    if (typeof val === 'string') return val
    if (typeof val === 'object' && 'id' in val && typeof (val as { id: unknown }).id === 'string') {
        return (val as { id: string }).id
    }
    return String(val)
}

/**
 * Menghasilkan pasangan final (dan perebutan juara 3 jika diaktifkan) dari hasil 2 match semifinal.
 *
 * Sesuai docs/business-rules.md §4.7:
 * - Menerima 2 match semifinal yang sudah completed (masing-masing punya team_a_id, team_b_id, winner_team_id).
 * - Pemenang dan yang kalah dihitung dari winner_team_id vs team_a_id/team_b_id masing-masing semifinal.
 * - Mengembalikan:
 *   - final: { teamAId: <pemenang SF1>, teamBId: <pemenang SF2> }
 *   - thirdPlace: { teamAId: <kalah SF1>, teamBId: <kalah SF2> } JIKA thirdPlaceEnabled true, atau null jika false.
 */
export function generateFinalPairing(
    semifinalMatches: SemifinalMatchForFinalPairing[],
    thirdPlaceEnabled: boolean
): FinalPairingResult {
    if (!semifinalMatches || !Array.isArray(semifinalMatches) || semifinalMatches.length !== 2) {
        const count = Array.isArray(semifinalMatches) ? semifinalMatches.length : 0
        throw new Error(`Dibutuhkan tepat 2 match semifinal untuk membuat pairing final, diterima: ${count}`)
    }

    const extractWinnerAndLoser = (match: SemifinalMatchForFinalPairing, sfIndex: number) => {
        const teamA = getTeamId(
            match.team_a_id ?? match.teamAId ?? match.team_a ?? match.teamA
        )
        const teamB = getTeamId(
            match.team_b_id ?? match.teamBId ?? match.team_b ?? match.teamB
        )
        const winner = getTeamId(
            match.winner_team_id ?? match.winnerTeamId ?? match.winner
        )

        if (!teamA || !teamB) {
            throw new Error(`Match semifinal ${sfIndex} belum memiliki data tim yang valid.`)
        }

        if (!winner) {
            throw new Error(`Match semifinal ${sfIndex} belum memiliki pemenang (winner_team_id kosong).`)
        }

        if (winner !== teamA && winner !== teamB) {
            throw new Error(
                `winner_team_id (${winner}) pada semifinal ${sfIndex} tidak cocok dengan tim A (${teamA}) maupun tim B (${teamB}).`
            )
        }

        const loser = winner === teamA ? teamB : teamA
        return { winner, loser }
    }

    const sf1 = extractWinnerAndLoser(semifinalMatches[0], 1)
    const sf2 = extractWinnerAndLoser(semifinalMatches[1], 2)

    return {
        final: {
            teamAId: sf1.winner,
            teamBId: sf2.winner,
        },
        thirdPlace: thirdPlaceEnabled
            ? {
                  teamAId: sf1.loser,
                  teamBId: sf2.loser,
              }
            : null,
    }
}
