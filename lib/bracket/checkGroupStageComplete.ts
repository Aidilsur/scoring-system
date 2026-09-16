import type { Match } from '@/types/domain'

/**
 * Memeriksa apakah seluruh pertandingan fase grup (round = 'group') telah selesai.
 *
 * Aturan sesuai docs/business-rules.md §4.7:
 * - Mengembalikan true jika SEMUA match round='group' dalam kategori tsb sudah status='completed'.
 * - Mengembalikan false jika masih ada match fase grup yang belum 'completed' (misal: 'scheduled', 'live', dll).
 * - Jika tidak ada match fase grup sama sekali (array kosong atau tidak ada round='group'), mengembalikan false.
 */
export function checkGroupStageComplete(
    matches: Pick<Match, 'round' | 'status'>[]
): boolean {
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
        return false
    }

    const groupMatches = matches.filter((m) => m.round === 'group')
    if (groupMatches.length === 0) {
        return false
    }

    return groupMatches.every((m) => m.status === 'completed')
}
