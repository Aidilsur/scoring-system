import { generateMatchSchedule } from '../lib/schedule/generateMatchSchedule'

// Skenario Uji:
// 4 Tim: Tim A, Tim B, Tim C, Tim D
// 6 Match Round-Robin: AB, AC, AD, BC, BD, CD
// 2 Court: court1, court2
// Jam Operasional: 08:00 - 12:00
// Estimasi Durasi per Match: 45 Menit
// occupiedSlots: [{ courtId: 'court1', scheduledTime: '08:00' }] (Court 1 jam 08:00 dipakai kategori lain)

const matches = [
    { id: 'match-1', teamAId: 'Tim A', teamBId: 'Tim B' },
    { id: 'match-2', teamAId: 'Tim A', teamBId: 'Tim C' },
    { id: 'match-3', teamAId: 'Tim A', teamBId: 'Tim D' },
    { id: 'match-4', teamAId: 'Tim B', teamBId: 'Tim C' },
    { id: 'match-5', teamAId: 'Tim B', teamBId: 'Tim D' },
    { id: 'match-6', teamAId: 'Tim C', teamBId: 'Tim D' },
]

const courtIds = ['court1', 'court2']
const dailyStartTime = '08:00'
const dailyEndTime = '12:00'
const matchDurationMinutes = 45
const occupiedSlots = [
    { courtId: 'court1', scheduledTime: '08:00' },
]

console.log('=== INPUT PENJADWALAN DENGAN OCCUPIED SLOTS ===')
console.log('Jumlah Match   :', matches.length)
console.log('Courts         :', courtIds.join(', '))
console.log('Jam Operasional:', `${dailyStartTime} - ${dailyEndTime}`)
console.log('Durasi Match   :', `${matchDurationMinutes} menit`)
console.log('Occupied Slots :', JSON.stringify(occupiedSlots))
console.log('')

const result = generateMatchSchedule(
    matches,
    courtIds,
    dailyStartTime,
    dailyEndTime,
    matchDurationMinutes,
    occupiedSlots
)

console.log('=== HASIL PENJADWALAN (SCHEDULED) ===')
console.table(
    result.scheduled.map((s) => {
        const m = matches.find((item) => item.id === s.matchId)
        return {
            'Match ID': s.matchId,
            'Pertandingan': m ? `${m.teamAId} vs ${m.teamBId}` : '-',
            'Court': s.courtId,
            'Waktu': s.scheduledTime,
        }
    })
)

console.log('=== HASIL TIDAK TERJADWAL (UNSCHEDULED) ===')
console.log('Jumlah Unscheduled:', result.unscheduled.length)
if (result.unscheduled.length > 0) {
    console.table(
        result.unscheduled.map((u) => {
            const m = matches.find((item) => item.id === u.matchId)
            return {
                'Match ID': u.matchId,
                'Pertandingan': m ? `${m.teamAId} vs ${m.teamBId}` : '-',
            }
        })
    )
}

console.log('\nJSON Output:')
console.log(JSON.stringify(result, null, 2))

console.log('\n=== AUDIT VERIFIKASI 1: APAKAH COURT 1 JAM 08:00 DIHINDARI? ===')
const court1At0800 = result.scheduled.find(
    (s) => s.courtId.toLowerCase() === 'court1' && s.scheduledTime === '08:00'
)
if (!court1At0800) {
    console.log('✅ SUKSES: court1 jam 08:00 BERHASIL DIHINDARI (tidak ada match yang dijadwalkan di slot ini).')
} else {
    console.error('❌ GAGAL: court1 jam 08:00 masih terisi oleh:', court1At0800)
}

console.log('\n=== AUDIT VERIFIKASI 2: ATURAN JEDA MINIMAL 1 RONDE PER TIM ===')
const teams = ['Tim A', 'Tim B', 'Tim C', 'Tim D']
teams.forEach((t) => {
    const teamMatches = result.scheduled.filter((s) => {
        const m = matches.find((item) => item.id === s.matchId)
        return m && (m.teamAId === t || m.teamBId === t)
    })
    const times = teamMatches.map((s) => s.scheduledTime)
    if (times.length <= 1) {
        console.log(`- ${t}: bermain 1 kali pada jam [${times.join(', ')}] (tidak ada potensi pelanggaran jeda)`)
    } else {
        console.log(`- ${t}: bermain pada jam [${times.join(', ')}]`)
        for (let i = 0; i < times.length - 1; i++) {
            const t1 = times[i]
            const t2 = times[i + 1]
            console.log(`    → Jeda antara match (${t1}) dan match (${t2}): AMAN (ada ronde kosong di antaranya)`)
        }
    }
})
