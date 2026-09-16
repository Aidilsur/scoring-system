export interface GroupStandingInputItem<T = unknown> {
    group?: { id?: string; name?: string } | string
    name?: string
    standings?: (T | { team?: T })[]
    teams?: (T | { team?: T })[]
    winner?: T
    runnerUp?: T
    juara?: T
    runner_up?: T
}

export interface SemifinalPairing<T = unknown> {
    matchNumber: number
    round: 'semifinal'
    team_a: T
    team_b: T
}

function extractWinnerAndRunnerUp<T>(groupItem: GroupStandingInputItem<T>): {
    winner: T
    runnerUp: T
} {
    let winner: T | undefined
    let runnerUp: T | undefined

    if (groupItem.winner !== undefined || groupItem.juara !== undefined) {
        winner = (groupItem.winner ?? groupItem.juara) as T
    }
    if (groupItem.runnerUp !== undefined || groupItem.runner_up !== undefined) {
        runnerUp = (groupItem.runnerUp ?? groupItem.runner_up) as T
    }

    if (winner === undefined || runnerUp === undefined) {
        const list = groupItem.standings ?? groupItem.teams
        if (Array.isArray(list)) {
            if (list.length < 2) {
                const groupName =
                    (typeof groupItem.group === 'object' ? groupItem.group?.name : groupItem.group) ??
                    groupItem.name ??
                    'grup'
                throw new Error(
                    `Data klasemen untuk ${groupName} belum lengkap (minimal 2 tim: juara dan runner-up).`
                )
            }

            const item0 = list[0] as unknown
            const item1 = list[1] as unknown

            winner = (
                item0 && typeof item0 === 'object' && 'team' in item0 && (item0 as { team: T }).team
                    ? (item0 as { team: T }).team
                    : item0
            ) as T

            runnerUp = (
                item1 && typeof item1 === 'object' && 'team' in item1 && (item1 as { team: T }).team
                    ? (item1 as { team: T }).team
                    : item1
            ) as T
        }
    }

    if (winner === undefined || runnerUp === undefined) {
        const groupName =
            (typeof groupItem.group === 'object' ? groupItem.group?.name : groupItem.group) ??
            groupItem.name ??
            'grup'
        throw new Error(`Gagal mengekstrak juara dan runner-up dari data ${groupName}.`)
    }

    return { winner, runnerUp }
}

/**
 * Menghasilkan pasangan semifinal sistem gugur (knockout) dari hasil fase grup.
 *
 * Sesuai docs/business-rules.md §4.7 & docs/project-rules.md §8:
 * - HANYA menangani kasus 2 grup (pola silang):
 *   - Semifinal 1: Juara Grup A vs Runner-up Grup B
 *   - Semifinal 2: Juara Grup B vs Runner-up Grup A
 * - Jika dipanggil dengan jumlah grup selain 2, function melempar error:
 *   "Pairing untuk N grup belum didukung"
 */
export function generateBracketPairing<T = unknown>(
    groupStandings: GroupStandingInputItem<T>[]
): SemifinalPairing<T>[] {
    if (!groupStandings || !Array.isArray(groupStandings) || groupStandings.length !== 2) {
        const count = Array.isArray(groupStandings) ? groupStandings.length : 0
        throw new Error(`Pairing untuk ${count} grup belum didukung`)
    }

    const groupA = groupStandings[0]
    const groupB = groupStandings[1]

    const { winner: winnerA, runnerUp: runnerUpA } = extractWinnerAndRunnerUp(groupA)
    const { winner: winnerB, runnerUp: runnerUpB } = extractWinnerAndRunnerUp(groupB)

    return [
        {
            matchNumber: 1,
            round: 'semifinal',
            team_a: winnerA,
            team_b: runnerUpB,
        },
        {
            matchNumber: 2,
            round: 'semifinal',
            team_a: winnerB,
            team_b: runnerUpA,
        },
    ]
}
