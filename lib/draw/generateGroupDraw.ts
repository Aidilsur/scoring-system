import { Team } from '@/types/domain'

export interface DrawnGroup {
  name: string
  teams: Team[]
}

export type Group = DrawnGroup

/**
 * Mengacak array menggunakan algoritma Fisher-Yates (Knuth shuffle).
 * Menghasilkan permutasi acak yang seragam (unbiased), berbeda dengan `sort(() => Math.random() - 0.5)`.
 * Fungsi ini murni (pure function) dan tidak memutasi array asli.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

/**
 * Menghasilkan label nama grup otomatis (Group A, Group B, ..., Group Z, Group AA, dst.)
 */
export function formatGroupName(index: number): string {
  let label = ''
  let num = index
  while (num >= 0) {
    label = String.fromCharCode(65 + (num % 26)) + label
    num = Math.floor(num / 26) - 1
  }
  return `Group ${label}`
}

/**
 * Melakukan pengacakan dan pembagian tim ke dalam grup-grup.
 * 
 * @param teams Daftar tim yang akan diikutsertakan dalam draw (biasanya yang berstatus confirmed)
 * @param groupSizes Array ukuran tiap grup (hasil dari distributeTeamsToGroups)
 * @returns Array objek grup yang berisi nama grup otomatis dan daftar tim yang dialokasikan
 */
export function generateGroupDraw(
  teams: Team[],
  groupSizes: number[]
): DrawnGroup[] {
  if (teams.length === 0 || groupSizes.length === 0) {
    return []
  }

  // Acak urutan tim menggunakan algoritma Fisher-Yates
  const shuffledTeams = shuffle(teams)

  const groups: DrawnGroup[] = []
  let cursor = 0

  for (let i = 0; i < groupSizes.length; i++) {
    const size = groupSizes[i]
    const allocatedTeams = shuffledTeams.slice(cursor, cursor + size)
    cursor += size

    groups.push({
      name: formatGroupName(i),
      teams: allocatedTeams,
    })
  }

  return groups
}
