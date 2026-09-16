interface RoundRobinMatchPair {
  teamAId: string
  teamBId: string
}

/**
 * Menghasilkan semua kombinasi pasangan pertandingan round robin tanpa duplikat
 * dan tanpa tim bertanding melawan dirinya sendiri.
 * 
 * Jumlah pertandingan yang dihasilkan adalah tepat n × (n - 1) / 2.
 * Contoh:
 * - 4 tim (A, B, C, D) -> 4 × 3 / 2 = 6 pertandingan:
 *   [A vs B, A vs C, A vs D, B vs C, B vs D, C vs D]
 * - 5 tim -> 5 × 4 / 2 = 10 pertandingan
 * - 3 tim -> 3 × 2 / 2 = 3 pertandingan
 * - < 2 tim -> 0 pertandingan (array kosong)
 * 
 * @param teamIds Array id tim yang berada dalam satu grup
 * @returns Array pasangan teamAId dan teamBId
 */
export function generateRoundRobinSchedule(
  teamIds: string[]
): RoundRobinMatchPair[] {
  if (!teamIds || teamIds.length < 2) {
    return []
  }

  const matches: RoundRobinMatchPair[] = []
  const n = teamIds.length

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      matches.push({
        teamAId: teamIds[i],
        teamBId: teamIds[j],
      })
    }
  }

  return matches
}
