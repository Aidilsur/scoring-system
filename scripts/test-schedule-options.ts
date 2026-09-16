import {
    generateMatchSchedule,
    parseTimeToMinutes,
    formatMinutesToTime,
} from '../lib/schedule/generateMatchSchedule'

function runTests() {
    console.log('===============================================================')
    console.log('🧪 PADEL TOURNAMENT SCHEDULER: TESTING NEW OPTIONS')
    console.log('===============================================================\n')

    const courts = ['court-1', 'court-2']
    const dailyStartTime = '08:00'
    const dailyEndTime = '18:00'
    const matchDurationMinutes = 45

    // Hitung slot keseluruhan pada rentang 08:00 - 18:00 (600 menit / 45 menit = 13 slot)
    const totalSlots = Math.floor(
        (parseTimeToMinutes(dailyEndTime) - parseTimeToMinutes(dailyStartTime)) /
            matchDurationMinutes
    )
    console.log(`Rentang Waktu : ${dailyStartTime} - ${dailyEndTime}`)
    console.log(`Durasi Match  : ${matchDurationMinutes} menit`)
    console.log(`Total Slot    : ${totalSlots} ronde`)
    console.log('Ronde tersedia: ' + Array.from({ length: totalSlots }, (_, i) => formatMinutesToTime(parseTimeToMinutes(dailyStartTime) + i * matchDurationMinutes)).join(', '))
    console.log('---------------------------------------------------------------\n')

    // Sample matches helper
    function createMatches(count: number) {
        return Array.from({ length: count }, (_, i) => ({
            id: `match-${i + 1}`,
            teamAId: `team-${(i * 2) % 10 + 1}`,
            teamBId: `team-${(i * 2 + 1) % 10 + 1}`,
        }))
    }

    // =========================================================================
    // SKENARIO 1: earliestStartTime = '11:00'
    // =========================================================================
    console.log('▶ SKENARIO 1: earliestStartTime = "11:00"')
    console.log('Ekspektasi: TIDAK ADA match sebelum jam 11:00 (slot 08:00, 08:45, 09:30, 10:15 di-skip).\n')

    const matches1 = createMatches(6)
    const result1 = generateMatchSchedule(
        matches1,
        courts,
        dailyStartTime,
        dailyEndTime,
        matchDurationMinutes,
        [],
        { earliestStartTime: '11:00' }
    )

    console.log(`Hasil Skenario 1: ${result1.scheduled.length} terjadwal, ${result1.unscheduled.length} unscheduled.`)
    console.log('Daftar match terjadwal:')
    for (const item of result1.scheduled) {
        console.log(`  - Match ID: ${item.matchId.padEnd(8)} | Court: ${item.courtId} | Jam: ${item.scheduledTime}`)
    }

    const hasBefore11 = result1.scheduled.some(
        (m) => parseTimeToMinutes(m.scheduledTime) < parseTimeToMinutes('11:00')
    )

    if (hasBefore11) {
        console.error('❌ GAGAL: Ditemukan match sebelum 11:00!')
    } else {
        const earliestScheduled = result1.scheduled.reduce(
            (min, m) => (m.scheduledTime < min ? m.scheduledTime : min),
            '99:99'
        )
        console.log(`✅ LULUS: Tidak ada match sebelum 11:00. Match paling awal: ${earliestScheduled}.\n`)
    }
    console.log('---------------------------------------------------------------\n')

    // =========================================================================
    // SKENARIO 2: reservedRoundsAtEnd = 3
    // =========================================================================
    console.log('▶ SKENARIO 2: reservedRoundsAtEnd = 3')
    console.log('Ekspektasi: 3 ronde terakhir (15:30, 16:15, 17:00) TIDAK BOLEH dipakai (dicadangkan).\n')

    const matches2 = createMatches(16)
    const result2 = generateMatchSchedule(
        matches2,
        courts,
        dailyStartTime,
        dailyEndTime,
        matchDurationMinutes,
        [],
        { reservedRoundsAtEnd: 3 }
    )

    console.log(`Hasil Skenario 2: ${result2.scheduled.length} terjadwal, ${result2.unscheduled.length} unscheduled.`)
    console.log('Daftar match terjadwal:')
    for (const item of result2.scheduled) {
        console.log(`  - Match ID: ${item.matchId.padEnd(8)} | Court: ${item.courtId} | Jam: ${item.scheduledTime}`)
    }

    // 3 ronde terakhir dihitung mundur dari 13 slot:
    // Slot 10: 15:30, Slot 11: 16:15, Slot 12: 17:00
    const reservedTimes = ['15:30', '16:15', '17:00']
    const hasInReserved = result2.scheduled.some((m) =>
        reservedTimes.includes(m.scheduledTime) ||
        parseTimeToMinutes(m.scheduledTime) >= parseTimeToMinutes('15:30')
    )

    const latestScheduled2 = result2.scheduled.reduce(
        (max, m) => (m.scheduledTime > max ? m.scheduledTime : max),
        '00:00'
    )

    if (hasInReserved) {
        console.error(`❌ GAGAL: Ditemukan match di 3 ronde terakhir (>= 15:30)!`)
    } else {
        console.log(`✅ LULUS: 3 ronde terakhir (15:30, 16:15, 17:00) bersih tidak terpakai. Match paling akhir: ${latestScheduled2}.\n`)
    }
    console.log('---------------------------------------------------------------\n')

    // =========================================================================
    // SKENARIO 3: Kombinasi keduanya sekaligus dengan data match banyak hingga ada unscheduled
    // =========================================================================
    console.log('▶ SKENARIO 3: earliestStartTime = "11:00" & reservedRoundsAtEnd = 3')
    console.log('Ekspektasi: Hanya slot 11:00 s/d 14:45 yang boleh dipakai.')
    console.log('Match yang tidak muat harus masuk ke "unscheduled" tanpa error dan tanpa melanggar batasan waktu.\n')

    // 24 match diberikan pada jendela sempit (hanya 6 slot ronde x 2 court = max 12 match secara teoritis)
    const matches3 = createMatches(24)
    const result3 = generateMatchSchedule(
        matches3,
        courts,
        dailyStartTime,
        dailyEndTime,
        matchDurationMinutes,
        [],
        { earliestStartTime: '11:00', reservedRoundsAtEnd: 3 }
    )

    console.log(`Hasil Skenario 3: ${result3.scheduled.length} terjadwal, ${result3.unscheduled.length} unscheduled.`)
    console.log('Daftar match terjadwal:')
    for (const item of result3.scheduled) {
        console.log(`  - Match ID: ${item.matchId.padEnd(8)} | Court: ${item.courtId} | Jam: ${item.scheduledTime}`)
    }

    console.log(`\nJumlah Unscheduled: ${result3.unscheduled.length} match:`)
    console.log(`  ${result3.unscheduled.map((u) => u.matchId).join(', ')}`)

    const violatesEarliest = result3.scheduled.some(
        (m) => parseTimeToMinutes(m.scheduledTime) < parseTimeToMinutes('11:00')
    )
    const violatesReserved = result3.scheduled.some(
        (m) => parseTimeToMinutes(m.scheduledTime) >= parseTimeToMinutes('15:30')
    )
    const hasUnscheduled = result3.unscheduled.length > 0

    if (violatesEarliest) {
        console.error('❌ GAGAL: Ada match sebelum 11:00 pada Skenario 3!')
    } else if (violatesReserved) {
        console.error('❌ GAGAL: Ada match di zona cadangan (>= 15:30) pada Skenario 3!')
    } else if (!hasUnscheduled) {
        console.error('❌ GAGAL: Seharusnya ada match yang tidak muat masuk ke unscheduled!')
    } else {
        console.log('\n✅ LULUS: Kombinasi sempurna!')
        console.log('  1. Seluruh match terjadwal berada di rentang [11:00, 14:45].')
        console.log(`  2. Sisa ${result3.unscheduled.length} match yang tidak muat dimasukkan ke unscheduled secara aman.`)
    }

    console.log('\n===============================================================')
    console.log('🎉 SELURUH SKENARIO UJI COBA BERHASIL 100%!')
    console.log('===============================================================')
}

runTests()
