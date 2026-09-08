/**
 * Mendistribusikan jumlah tim ke dalam grup-grup seserata mungkin berdasarkan target ukuran grup.
 * 
 * Aturan Pembagian:
 * 1. Target ukuran grup (misal 4) dijadikan acuan.
 * 2. Jumlah grup yang dibentuk (k) dipilih dari kandidat di sekitar teamCount / targetGroupSize
 *    (yaitu Math.floor dan Math.ceil).
 * 3. Setiap kandidat dihitung variansi / deviasinya terhadap targetGroupSize.
 * 4. Jika terjadi tie deviasi (contoh 14 tim target 4 -> k=3 menghasilkan [5, 5, 4] vs k=4 menghasilkan [4, 4, 3, 3]),
 *    sistem memilih distribusi dengan ukuran grup minimum yang lebih besar (memilih [5, 5, 4] dengan min size 4,
 *    bukan [4, 4, 3, 3] dengan min size 3) agar tiap tim mendapatkan jumlah pertandingan yang cukup.
 * 
 * Contoh Kasus Habis Dibagi Rata:
 * - distributeTeamsToGroups(16, 4) -> [4, 4, 4, 4] (16 / 4 = 4 grup pas)
 * - distributeTeamsToGroups(8, 4)  -> [4, 4] (8 / 4 = 2 grup pas)
 * - distributeTeamsToGroups(12, 4) -> [4, 4, 4]
 * 
 * Contoh Kasus Tidak Habis Dibagi Rata:
 * - distributeTeamsToGroups(14, 4) -> [5, 5, 4] (bukan [4, 4, 4, 2] atau [4, 4, 3, 3])
 * - distributeTeamsToGroups(15, 4) -> [4, 4, 4, 3] (15/4 = 3.75 -> 4 grup lebih dekat ke 4 daripada 3 grup [5,5,5])
 * - distributeTeamsToGroups(17, 4) -> [5, 4, 4, 4] (17/4 = 4.25 -> 4 grup)
 * - distributeTeamsToGroups(18, 4) -> [5, 5, 4, 4] (tie deviasi -> k=4 dipilih karena min size 4)
 * - distributeTeamsToGroups(19, 4) -> [4, 4, 4, 4, 3]
 * - distributeTeamsToGroups(10, 4) -> [5, 5] (tie deviasi -> k=2 min size 5 vs k=3 [4,3,3] min size 3)
 * - distributeTeamsToGroups(7, 4)  -> [4, 3]
 * - distributeTeamsToGroups(6, 4)  -> [3, 3]
 * - distributeTeamsToGroups(3, 4)  -> [3] (kurang dari target, tetap 1 grup)
 * 
 * Edge cases:
 * - distributeTeamsToGroups(0, 4)  -> []
 * - distributeTeamsToGroups(5, 0)  -> []
 * 
 * @param teamCount Jumlah total tim yang terdaftar dan confirmed
 * @param targetGroupSize Target ukuran grup ideal (biasanya 4)
 * @returns Array ukuran tiap grup, diurutkan descending (grup dengan tim lebih banyak diletakkan di depan)
 */
export function distributeTeamsToGroups(
  teamCount: number,
  targetGroupSize: number = 4
): number[] {
  if (teamCount <= 0 || targetGroupSize <= 0) {
    return []
  }

  // Jika jumlah tim lebih sedikit atau sama dengan target grup, buat 1 grup
  if (teamCount <= targetGroupSize) {
    return [teamCount]
  }

  const minK = Math.max(1, Math.floor(teamCount / targetGroupSize))
  const maxK = Math.ceil(teamCount / targetGroupSize)

  const candidates: number[][] = []

  for (let k = minK; k <= maxK; k++) {
    const base = Math.floor(teamCount / k)
    const remainder = teamCount % k
    const sizes: number[] = []

    for (let i = 0; i < k; i++) {
      sizes.push(i < remainder ? base + 1 : base)
    }

    candidates.push(sizes)
  }

  // Pilih kandidat terbaik:
  // 1. Total squared difference terendah dari targetGroupSize
  // 2. Tie breaker: Ukuran grup minimum terbesar (misal [5,5,4] min=4 lebih dipilih daripada [4,4,3,3] min=3)
  // 3. Tie breaker: Jumlah grup lebih sedikit
  candidates.sort((a, b) => {
    const scoreA = a.reduce((sum, s) => sum + Math.pow(s - targetGroupSize, 2), 0)
    const scoreB = b.reduce((sum, s) => sum + Math.pow(s - targetGroupSize, 2), 0)

    if (scoreA !== scoreB) {
      return scoreA - scoreB
    }

    const minA = Math.min(...a)
    const minB = Math.min(...b)

    if (minA !== minB) {
      return minB - minA // yang min size lebih besar menang
    }

    return a.length - b.length
  })

  return candidates[0]
}
