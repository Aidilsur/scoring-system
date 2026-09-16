/**
 * Pure scheduling algorithm for Padel Tournament System
 * Sesuai spesifikasi docs/business-rules.md §4.8
 * 
 * Round-based greedy scheduling:
 * 1. Menghitung total slot waktu per court berdasarkan dailyStartTime, dailyEndTime, dan matchDurationMinutes.
 * 2. Menjadwalkan match per ronde (1 ronde = 1 slot waktu dengan N court paralel).
 * 3. Memprioritaskan match yang kedua timnya paling lama belum bertanding (istirahat terlama).
 * 4. Menjamin tidak ada tim yang bermain lebih dari 1 kali di ronde (slot waktu) yang sama.
 * 5. Jika slot waktu habis, match yang belum terjadwal dimasukkan ke array unscheduled.
 */

export interface ScheduleMatchInput {
    id: string
    teamAId: string
    teamBId: string
}

export interface OccupiedSlot {
    courtId: string
    scheduledTime: string
}

export interface ScheduledMatchItem {
    matchId: string
    courtId: string
    scheduledTime: string // Format "HH:mm"
}

export interface UnscheduledMatchItem {
    matchId: string
}

export interface ScheduleResult {
    scheduled: ScheduledMatchItem[]
    unscheduled: UnscheduledMatchItem[]
}

/**
 * Mengonversi string waktu "HH:mm" atau "HH:mm:ss" ke menit sejak tengah malam.
 */
export function parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0
    const parts = timeStr.trim().split(':')
    const hours = parseInt(parts[0], 10) || 0
    const minutes = parseInt(parts[1], 10) || 0
    return hours * 60 + minutes
}

/**
 * Mengonversi menit sejak tengah malam ke string waktu format "HH:mm".
 */
export function formatMinutesToTime(totalMinutes: number): string {
    const normalized = Math.max(0, totalMinutes)
    const hours = Math.floor(normalized / 60) % 24
    const mins = normalized % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export interface GenerateScheduleOptions {
    earliestStartTime?: string
    reservedRoundsAtEnd?: number
}

/**
 * Menghasilkan jadwal pertandingan berdasarkan ketersediaan court dan jam operasional harian.
 * 
 * @param matches Daftar match yang akan dijadwalkan
 * @param courtIds Daftar ID lapangan yang tersedia
 * @param dailyStartTime Jam mulai operasional harian (format "HH:mm")
 * @param dailyEndTime Jam selesai operasional harian (format "HH:mm")
 * @param matchDurationMinutes Estimasi durasi per match dalam menit
 * @param occupiedSlots Daftar slot (courtId + scheduledTime) yang sudah terpakai oleh kategori lain
 * @param options Opsi tambahan: earliestStartTime dan reservedRoundsAtEnd
 * @returns Objek berisi array match yang berhasil terjadwal dan yang tidak muat (unscheduled)
 */
export function generateMatchSchedule(
    matches: { id: string; teamAId: string; teamBId: string }[],
    courtIds: string[],
    dailyStartTime: string,
    dailyEndTime: string,
    matchDurationMinutes: number,
    occupiedSlots: { courtId: string; scheduledTime: string }[] = [],
    options?: GenerateScheduleOptions
): {
    scheduled: { matchId: string; courtId: string; scheduledTime: string }[]
    unscheduled: { matchId: string }[]
} {
    // 1. Guard clause jika input tidak valid atau kosong
    if (!matches || matches.length === 0) {
        return { scheduled: [], unscheduled: [] }
    }

    if (!courtIds || courtIds.length === 0 || matchDurationMinutes <= 0) {
        return {
            scheduled: [],
            unscheduled: matches.map((m) => ({ matchId: m.id })),
        }
    }

    const startMinutes = parseTimeToMinutes(dailyStartTime)
    const endMinutes = parseTimeToMinutes(dailyEndTime)
    const availableMinutes = endMinutes - startMinutes

    if (availableMinutes <= 0) {
        return {
            scheduled: [],
            unscheduled: matches.map((m) => ({ matchId: m.id })),
        }
    }

    // 2. Hitung jumlah ronde / slot waktu yang tersedia
    const totalSlots = Math.floor(availableMinutes / matchDurationMinutes)
    if (totalSlots <= 0) {
        return {
            scheduled: [],
            unscheduled: matches.map((m) => ({ matchId: m.id })),
        }
    }

    // Hitung batas maksimum ronde jika ada reservasi di akhir (reservedRoundsAtEnd)
    const reservedAtEnd = Math.max(0, options?.reservedRoundsAtEnd || 0)
    const effectiveTotalSlots = Math.max(0, totalSlots - reservedAtEnd)

    const earliestMinutes = options?.earliestStartTime
        ? parseTimeToMinutes(options.earliestStartTime)
        : -1

    // 3. Setup state penjadwalan
    const remainingMatches = [...matches]
    const scheduled: ScheduledMatchItem[] = []

    // Lookup set untuk occupiedSlots (courtId + scheduledTime)
    const occupiedKey = (courtId: string, timeStr: string): string =>
        `${courtId.trim().toLowerCase()}__${timeStr.trim().slice(0, 5)}`

    const occupiedSet = new Set<string>(
        (occupiedSlots || []).map((s) => occupiedKey(s.courtId, s.scheduledTime))
    )

    // Melacak ronde terakhir suatu tim bermain.
    // Tim yang belum pernah main diinisialisasi ke nilai prioritas tertinggi
    const INITIAL_REST_SCORE = 999999
    const lastRoundPlayed = new Map<string, number>()

    /**
     * Menghitung berapa ronde suatu tim telah beristirahat.
     */
    const getTeamRest = (teamId: string, currentRound: number): number => {
        const lastRound = lastRoundPlayed.get(teamId)
        return lastRound !== undefined ? currentRound - lastRound : INITIAL_REST_SCORE
    }

    /**
     * Aturan Wajib Jeda:
     * Sebuah tim TIDAK BOLEH bermain di ronde yang berurutan langsung dengan match terakhirnya.
     * Harus ada MINIMAL 1 ronde jeda penuh di antaranya (currentRound - lastRound >= 2).
     */
    const canTeamPlayInRound = (teamId: string, currentRound: number): boolean => {
        const lastRound = lastRoundPlayed.get(teamId)
        if (lastRound === undefined) return true
        return currentRound - lastRound >= 2
    }

    // 4. Iterasi per ronde (slot waktu)
    for (let roundIndex = 0; roundIndex < effectiveTotalSlots; roundIndex++) {
        if (remainingMatches.length === 0) break

        const slotTimeMinutes = startMinutes + roundIndex * matchDurationMinutes

        // Jika earliestStartTime diberikan, lewati slot sebelum waktu ini
        if (earliestMinutes >= 0 && slotTimeMinutes < earliestMinutes) {
            continue
        }

        const scheduledTime = formatMinutesToTime(slotTimeMinutes)

        // Set tim yang bertanding di ronde ini untuk mencegah tim main di 2 court bersamaan
        const teamsInThisRound = new Set<string>()

        // 5. Isi slot court pada ronde ini
        for (const courtId of courtIds) {
            if (remainingMatches.length === 0) break

            // Periksa apakah slot court ini pada jam ini sudah dipakai oleh kategori lain
            if (occupiedSet.has(occupiedKey(courtId, scheduledTime))) {
                continue
            }

            // Filter match kandidat:
            // 1. Tidak bertanding melawan diri sendiri
            // 2. Kedua tim belum bermain di ronde ini
            // 3. WAJIB: Kedua tim memenuhi syarat jeda minimal 1 ronde dari match sebelumnya
            const eligibleCandidates = remainingMatches.filter(
                (m) =>
                    m.teamAId !== m.teamBId &&
                    !teamsInThisRound.has(m.teamAId) &&
                    !teamsInThisRound.has(m.teamBId) &&
                    canTeamPlayInRound(m.teamAId, roundIndex) &&
                    canTeamPlayInRound(m.teamBId, roundIndex)
            )

            if (eligibleCandidates.length === 0) {
                // Tidak ada lagi match yang valid tanpa melanggar aturan jeda atau bentrok pada ronde ini.
                // Court ini (dan court selanjutnya pada ronde ini) sengaja dibiarkan kosong.
                break
            }

            // Prioritaskan match yang tim-timnya paling lama belum main (istirahat terlama)
            eligibleCandidates.sort((a, b) => {
                const restA1 = getTeamRest(a.teamAId, roundIndex)
                const restA2 = getTeamRest(a.teamBId, roundIndex)
                const minRestA = Math.min(restA1, restA2)

                const restB1 = getTeamRest(b.teamAId, roundIndex)
                const restB2 = getTeamRest(b.teamBId, roundIndex)
                const minRestB = Math.min(restB1, restB2)

                // 1. Prioritaskan match dengan istirahat minimum dari kedua tim tertinggi
                if (minRestB !== minRestA) {
                    return minRestB - minRestA
                }

                // 2. Jika sama, prioritaskan match dengan total waktu istirahat tertinggi
                const sumRestA = restA1 + restA2
                const sumRestB = restB1 + restB2
                if (sumRestB !== sumRestA) {
                    return sumRestB - sumRestA
                }

                // 3. Tie-breaker deterministik berdasarkan urutan awal
                return remainingMatches.indexOf(a) - remainingMatches.indexOf(b)
            })

            const selectedMatch = eligibleCandidates[0]

            // Masukkan ke jadwal
            scheduled.push({
                matchId: selectedMatch.id,
                courtId,
                scheduledTime,
            })

            // Tandai tim sedang bermain di ronde ini
            teamsInThisRound.add(selectedMatch.teamAId)
            teamsInThisRound.add(selectedMatch.teamBId)

            // Hapus dari daftar match yang tersisa
            const matchIndex = remainingMatches.findIndex((m) => m.id === selectedMatch.id)
            if (matchIndex !== -1) {
                remainingMatches.splice(matchIndex, 1)
            }
        }

        // Catat bahwa tim-tim tersebut bermain di roundIndex ini
        for (const teamId of teamsInThisRound) {
            lastRoundPlayed.set(teamId, roundIndex)
        }
    }

    // 6. Match yang tidak muat masuk ke unscheduled
    const unscheduled: UnscheduledMatchItem[] = remainingMatches.map((m) => ({
        matchId: m.id,
    }))

    return {
        scheduled,
        unscheduled,
    }
}
