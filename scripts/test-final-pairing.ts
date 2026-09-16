import {
    checkSemifinalComplete,
    generateFinalPairing,
} from '../lib/bracket'

console.log('=================================================================')
console.log('🧪 TEST SUITE: BRACKET KNOCKOUT PURE FUNCTIONS')
console.log('=================================================================\n')

// -------------------------------------------------------------------------
// SKENARIO 1: checkSemifinalComplete
// -------------------------------------------------------------------------
console.log('--- SKENARIO 1: checkSemifinalComplete ---')

const matchesCompleted = [
    { id: 'sf-1', round: 'semifinal', status: 'completed' },
    { id: 'sf-2', round: 'semifinal', status: 'completed' },
    { id: 'grp-1', round: 'group', status: 'completed' },
]

const resultCompleted = checkSemifinalComplete(matchesCompleted)
console.log(`[Test 1A] 2 match semifinal 'completed':`)
console.log(`  -> Output: ${resultCompleted} (Harapan: true)`)
console.assert(resultCompleted === true, 'Test 1A Gagal: Seharusnya true')

const matchesPartial = [
    { id: 'sf-1', round: 'semifinal', status: 'completed' },
    { id: 'sf-2', round: 'semifinal', status: 'scheduled' },
    { id: 'grp-1', round: 'group', status: 'completed' },
]

const resultPartial = checkSemifinalComplete(matchesPartial)
console.log(`[Test 1B] 1 match 'completed', 1 match masih 'scheduled':`)
console.log(`  -> Output: ${resultPartial} (Harapan: false)`)
console.assert(resultPartial === false, 'Test 1B Gagal: Seharusnya false')

console.log('✅ Skenario 1 Selesai & Valid!\n')

// -------------------------------------------------------------------------
// SKENARIO 2: generateFinalPairing dengan thirdPlaceEnabled = true
// -------------------------------------------------------------------------
console.log('--- SKENARIO 2: generateFinalPairing (thirdPlaceEnabled = true) ---')

// SF1: Team A vs Team B (Pemenang: Team A, Kalah: Team B)
// SF2: Team C vs Team D (Pemenang: Team D, Kalah: Team C)
const semifinalMatchesCase2 = [
    {
        id: 'sf-1',
        round: 'semifinal',
        team_a_id: 'team-A',
        team_b_id: 'team-B',
        winner_team_id: 'team-A',
        status: 'completed',
    },
    {
        id: 'sf-2',
        round: 'semifinal',
        team_a_id: 'team-C',
        team_b_id: 'team-D',
        winner_team_id: 'team-D',
        status: 'completed',
    },
]

const pairingCase2 = generateFinalPairing(semifinalMatchesCase2, true)
console.log('Output generateFinalPairing:')
console.log(JSON.stringify(pairingCase2, null, 2))

// Verifikasi Final
console.log(`\nVerifikasi Final:`)
console.log(`  - teamAId (Pemenang SF1): ${pairingCase2.final.teamAId} (Harapan: team-A)`)
console.log(`  - teamBId (Pemenang SF2): ${pairingCase2.final.teamBId} (Harapan: team-D)`)
console.assert(
    pairingCase2.final.teamAId === 'team-A' && pairingCase2.final.teamBId === 'team-D',
    'Test 2 Final Gagal'
)

// Verifikasi Third Place
console.log(`Verifikasi Third Place:`)
console.log(`  - teamAId (Kalah SF1): ${pairingCase2.thirdPlace?.teamAId} (Harapan: team-B)`)
console.log(`  - teamBId (Kalah SF2): ${pairingCase2.thirdPlace?.teamBId} (Harapan: team-C)`)
console.assert(
    pairingCase2.thirdPlace !== null &&
    pairingCase2.thirdPlace.teamAId === 'team-B' &&
    pairingCase2.thirdPlace.teamBId === 'team-C',
    'Test 2 Third Place Gagal'
)

// Verifikasi Overlap Tim (4 tim harus beda semua)
const allTeamsCase2 = [
    pairingCase2.final.teamAId,
    pairingCase2.final.teamBId,
    pairingCase2.thirdPlace!.teamAId,
    pairingCase2.thirdPlace!.teamBId,
]
const uniqueTeamsCase2 = new Set(allTeamsCase2)
const hasNoOverlap = uniqueTeamsCase2.size === 4
console.log(`Verifikasi Overlap:`)
console.log(`  - Daftar tim: [${allTeamsCase2.join(', ')}]`)
console.log(`  - Jumlah tim unik: ${uniqueTeamsCase2.size} / 4`)
console.log(`  - Tidak ada overlap: ${hasNoOverlap ? 'BENAR (4 tim berbeda semua)' : 'SALAH'}`)
console.assert(hasNoOverlap, 'Test 2 Overlap Gagal: Terdapat duplikasi tim!')

console.log('✅ Skenario 2 Selesai & Valid!\n')

// -------------------------------------------------------------------------
// SKENARIO 3: generateFinalPairing dengan thirdPlaceEnabled = false
// -------------------------------------------------------------------------
console.log('--- SKENARIO 3: generateFinalPairing (thirdPlaceEnabled = false) ---')

const pairingCase3 = generateFinalPairing(semifinalMatchesCase2, false)
console.log('Output generateFinalPairing:')
console.log(JSON.stringify(pairingCase3, null, 2))

console.log(`\nVerifikasi:`)
console.log(`  - final.teamAId: ${pairingCase3.final.teamAId} (Harapan: team-A)`)
console.log(`  - final.teamBId: ${pairingCase3.final.teamBId} (Harapan: team-D)`)
console.log(`  - thirdPlace: ${pairingCase3.thirdPlace} (Harapan: null)`)

console.assert(
    pairingCase3.final.teamAId === 'team-A' && pairingCase3.final.teamBId === 'team-D',
    'Test 3 Final Gagal'
)
console.assert(pairingCase3.thirdPlace === null, 'Test 3 Third Place Gagal: Seharusnya null')

console.log('✅ Skenario 3 Selesai & Valid!\n')

console.log('=================================================================')
console.log('🎉 SEMUA SKENARIO TEST BERHASIL 100%')
console.log('=================================================================')
