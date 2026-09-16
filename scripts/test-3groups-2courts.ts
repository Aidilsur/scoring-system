import {
    generateMatchSchedule,
    ScheduleMatchInput,
} from '../lib/schedule/generateMatchSchedule'

console.log('=== TEST SCENARIO: 3 GRUP, 2 COURT DENGAN KNOCKOUT RESERVATION ===\n')

// Buat 3 grup dengan masing-masing 3 tim (A1,A2,A3 ; B1,B2,B3 ; C1,C2,C3)
// 3 match per grup = 9 match total
const matches9: ScheduleMatchInput[] = [
    // Grup A
    { id: 'm-A1', teamAId: 'team-A1', teamBId: 'team-A2' },
    { id: 'm-A2', teamAId: 'team-A1', teamBId: 'team-A3' },
    { id: 'm-A3', teamAId: 'team-A2', teamBId: 'team-A3' },
    // Grup B
    { id: 'm-B1', teamAId: 'team-B1', teamBId: 'team-B2' },
    { id: 'm-B2', teamAId: 'team-B1', teamBId: 'team-B3' },
    { id: 'm-B3', teamAId: 'team-B2', teamBId: 'team-B3' },
    // Grup C
    { id: 'm-C1', teamAId: 'team-C1', teamBId: 'team-C2' },
    { id: 'm-C2', teamAId: 'team-C1', teamBId: 'team-C3' },
    { id: 'm-C3', teamAId: 'team-C2', teamBId: 'team-C3' },
]

const courtIds = ['court-1', 'court-2']
const matchDuration = 45 // menit

// KASUS 1: Jam Operasional Cukup (08:00 - 16:00 = 8 jam = 10 ronde slot)
// 1 Kategori Aktif: Knockout = 3 match (2 SF + 1 Final) -> reservedRoundsAtEnd = ceil(3 / 2) = 2 ronde (90 menit akhir dicadangkan, dari 14:30 - 16:00)
// Sisa ronde untuk grup: 10 - 2 = 8 ronde (16 slot court) -> 9 match fase grup cukup dijadwalkan
console.log('--- KASUS 1: Jam operasional 08:00 - 16:00 (10 ronde), reserved 2 ronde ---')
const resCase1 = generateMatchSchedule(
    matches9,
    courtIds,
    '08:00',
    '16:00',
    matchDuration,
    [],
    { reservedRoundsAtEnd: 2 }
)
console.log(`Scheduled matches: ${resCase1.scheduled.length} / ${matches9.length}`)
console.log(`Unscheduled matches: ${resCase1.unscheduled.length}`)
const latestGroupTime = resCase1.scheduled.map(s => s.scheduledTime).sort().reverse()[0]
console.log(`Waktu match grup terakhir: ${latestGroupTime}`)
console.log('Apakah match melebihi batas sebelum reserved round (14:30)?', latestGroupTime < '14:30' ? 'AMAN' : 'MELANGGAR')

// Sekarang kita jadwalkan Semifinal dari kategori yang sama dengan earliestStartTime = latestGroupTime + duration (45m)
const earliestSFTime = '13:00' // misalnya setelah grup selesai
const sfMatches: ScheduleMatchInput[] = [
    { id: 'sf-1', teamAId: 't-sf1', teamBId: 't-sf2' },
    { id: 'sf-2', teamAId: 't-sf3', teamBId: 't-sf4' },
]
const resSF = generateMatchSchedule(
    sfMatches,
    courtIds,
    '08:00',
    '16:00',
    matchDuration,
    resCase1.scheduled.map(s => ({ courtId: s.courtId, scheduledTime: s.scheduledTime })),
    { earliestStartTime: '14:30' } // reserved block mulai 14:30
)
console.log(`\nScheduled Semifinal in reserved block: ${resSF.scheduled.length} / 2`)
resSF.scheduled.forEach(s => console.log(`  - ${s.matchId} at ${s.scheduledTime} on ${s.courtId}`))

// KASUS 2: Jam Operasional Ketat (08:00 - 12:00 = 4 jam = 5 ronde slot)
// Reserved 2 ronde untuk knockout -> Sisa untuk grup hanya 3 ronde (6 slot court)!
// 9 match grup tidak muat dalam 6 slot court -> sistem menghasilkan unscheduled dengan aman!
console.log('\n--- KASUS 2: Jam operasional ketat 08:00 - 12:00 (5 ronde), reserved 2 ronde ---')
const resCase2 = generateMatchSchedule(
    matches9,
    courtIds,
    '08:00',
    '12:00',
    matchDuration,
    [],
    { reservedRoundsAtEnd: 2 }
)
console.log(`Scheduled matches: ${resCase2.scheduled.length} / ${matches9.length}`)
console.log(`Unscheduled matches: ${resCase2.unscheduled.length} (KARENA SLOT TERBATAS AKIBAT BLOK CADANGAN)`)
console.log('Daftar unscheduled match IDs:', resCase2.unscheduled.map(m => m.matchId))
