import type { StandingRow, GroupStandingItem, Match } from '@/types/domain'

function hasDirectWinner(teamAId: string, teamBId: string, matches: Match[]): boolean {
    const m = matches.find(
        (match) =>
            (match.team_a_id === teamAId && match.team_b_id === teamBId) ||
            (match.team_a_id === teamBId && match.team_b_id === teamAId)
    )
    return Boolean(m && m.winner_team_id)
}

/**
 * Mengurutkan peringkat klasemen grup berdasarkan aturan §4.5:
 * 1. Poin (P) tertinggi
 * 2. Head-to-head (hasil pertemuan langsung antar tim yang sama poin)
 * 3. Selisih Game (S / game_diff) tertinggi
 * 4. Total Game Menang (games_for) tertinggi
 * 5. Jika masih sama pada posisi perebutan tiket semifinal (peringkat 1-3) -> alert keputusan manual
 */
export function sortGroupStandings(
    rows: StandingRow[],
    completedGroupMatches: Match[]
): {
    standings: GroupStandingItem[]
    hasTieRequiringManualDecision: boolean
} {
    const sorted = [...rows].sort((a, b) => {
        // 1. Poin tertinggi
        if (b.points !== a.points) {
            return b.points - a.points
        }

        // 2. Head-to-head antara a dan b jika ada match selesai
        const h2hMatch = completedGroupMatches.find(
            (m) =>
                (m.team_a_id === a.team_id && m.team_b_id === b.team_id) ||
                (m.team_a_id === b.team_id && m.team_b_id === a.team_id)
        )

        if (h2hMatch && h2hMatch.winner_team_id) {
            if (h2hMatch.winner_team_id === a.team_id) return -1
            if (h2hMatch.winner_team_id === b.team_id) return 1
        }

        // 3. Selisih Game (S / game_diff)
        if (b.game_diff !== a.game_diff) {
            return b.game_diff - a.game_diff
        }

        // 4. Total Game Menang (games_for)
        if (b.games_for !== a.games_for) {
            return b.games_for - a.games_for
        }

        return 0
    })

    let hasTieRequiringManualDecision = false

    const items: GroupStandingItem[] = sorted.map((row, index) => {
        const rank = index + 1
        let needsManualDecision = false

        const prev = sorted[index - 1]
        const next = sorted[index + 1]

        const isTiedWithPrev =
            Boolean(prev) &&
            prev.points === row.points &&
            prev.game_diff === row.game_diff &&
            prev.games_for === row.games_for &&
            !hasDirectWinner(prev.team_id, row.team_id, completedGroupMatches)

        const isTiedWithNext =
            Boolean(next) &&
            next.points === row.points &&
            next.game_diff === row.game_diff &&
            next.games_for === row.games_for &&
            !hasDirectWinner(row.team_id, next.team_id, completedGroupMatches)

        // Indikator keputusan manual jika tie terjadi di batas kelolosan (posisi 1, 2, atau 3)
        // dan kedua tim sudah memainkan minimal 1 match
        if ((isTiedWithPrev || isTiedWithNext) && rank <= 3 && row.played > 0) {
            needsManualDecision = true
            hasTieRequiringManualDecision = true
        }

        return {
            ...row,
            rank,
            isWinner: rank === 1,
            isRunnerUp: rank === 2,
            isQualified: rank === 1 || rank === 2,
            needsManualDecision,
        }
    })

    return {
        standings: items,
        hasTieRequiringManualDecision,
    }
}
