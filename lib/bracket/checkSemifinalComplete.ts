export interface CheckSemifinalMatchInput {
    round?: string | null
    status?: string | null
}

/**
 * Memeriksa apakah seluruh pertandingan semifinal (round = 'semifinal') telah selesai.
 *
 * Sesuai docs/business-rules.md §4.7:
 * - Mengembalikan true jika KEDUA match round='semifinal' dalam kategori tsb sudah status='completed'.
 * - Mengembalikan false jika belum (misal masih 'scheduled', 'live', atau jumlah semifinal != 2).
 */
export function checkSemifinalComplete(
    matches: CheckSemifinalMatchInput[]
): boolean {
    if (!matches || !Array.isArray(matches) || matches.length === 0) {
        return false
    }

    const semifinalMatches = matches.filter((m) => m.round === 'semifinal')
    if (semifinalMatches.length !== 2) {
        return false
    }

    return semifinalMatches.every((m) => m.status === 'completed')
}
