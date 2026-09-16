import { checkGroupStageComplete, generateBracketPairing } from '../lib/bracket'
import type { Match } from '../types/domain'

console.log('🧪 Testing lib/bracket pure functions...\n')

// -------------------------------------------------------------
// Test 1: checkGroupStageComplete
// -------------------------------------------------------------
console.log('--- Test 1: checkGroupStageComplete ---')

const allCompletedMatches: Pick<Match, 'round' | 'status'>[] = [
    { round: 'group', status: 'completed' },
    { round: 'group', status: 'completed' },
    { round: 'group', status: 'completed' },
    { round: 'group', status: 'completed' },
]

const resultCompleted = checkGroupStageComplete(allCompletedMatches)
console.log(`Semua match completed -> Result: ${resultCompleted} (Expected: true)`)
if (resultCompleted !== true) {
    throw new Error('Test failed: checkGroupStageComplete must return true for all completed matches')
}

const withLiveMatches: Pick<Match, 'round' | 'status'>[] = [
    { round: 'group', status: 'completed' },
    { round: 'group', status: 'live' },
    { round: 'group', status: 'completed' },
    { round: 'group', status: 'scheduled' },
]

const resultWithLive = checkGroupStageComplete(withLiveMatches)
console.log(`Dengan match live/scheduled -> Result: ${resultWithLive} (Expected: false)`)
if (resultWithLive !== false) {
    throw new Error('Test failed: checkGroupStageComplete must return false when live/scheduled match exists')
}

const emptyMatches: Pick<Match, 'round' | 'status'>[] = []
const resultEmpty = checkGroupStageComplete(emptyMatches)
console.log(`Array match kosong -> Result: ${resultEmpty} (Expected: false)`)
if (resultEmpty !== false) {
    throw new Error('Test failed: checkGroupStageComplete must return false for empty matches')
}

console.log('✅ checkGroupStageComplete passed all checks!\n')

// -------------------------------------------------------------
// Test 2: generateBracketPairing
// -------------------------------------------------------------
console.log('--- Test 2: generateBracketPairing ---')

const teamX = { id: 'team-x', name: 'TeamX' }
const teamY = { id: 'team-y', name: 'TeamY' }
const teamZ = { id: 'team-z', name: 'TeamZ' }
const teamW = { id: 'team-w', name: 'TeamW' }

// Uji kasus 2 grup sesuai permintaan user:
// Group A: juara=TeamX, runner-up=TeamY
// Group B: juara=TeamZ, runner-up=TeamW
const groupStandingsFormat1 = [
    {
        group: 'Group A',
        winner: teamX,
        runnerUp: teamY,
    },
    {
        group: 'Group B',
        winner: teamZ,
        runnerUp: teamW,
    },
]

const pairings1 = generateBracketPairing(groupStandingsFormat1)
console.log('Hasil Pairing (Format 1 - winner/runnerUp):')
console.log(
    pairings1.map(
        (p) => `Semifinal ${p.matchNumber}: ${(p.team_a as any).name} vs ${(p.team_b as any).name}`
    )
)

if (
    (pairings1[0].team_a as any).name !== 'TeamX' ||
    (pairings1[0].team_b as any).name !== 'TeamW' ||
    (pairings1[1].team_a as any).name !== 'TeamZ' ||
    (pairings1[1].team_b as any).name !== 'TeamY'
) {
    throw new Error('Test failed: pairing did not produce [{TeamX vs TeamW}, {TeamZ vs TeamY}]')
}

// Uji juga jika menggunakan array standings [juara, runner-up]:
const groupStandingsFormat2 = [
    {
        group: { name: 'Grup A' },
        standings: [teamX, teamY],
    },
    {
        group: { name: 'Grup B' },
        standings: [teamZ, teamW],
    },
]

const pairings2 = generateBracketPairing(groupStandingsFormat2)
console.log('\nHasil Pairing (Format 2 - standings list):')
console.log(
    pairings2.map(
        (p) => `Semifinal ${p.matchNumber}: ${(p.team_a as any).name} vs ${(p.team_b as any).name}`
    )
)

if (
    (pairings2[0].team_a as any).name !== 'TeamX' ||
    (pairings2[0].team_b as any).name !== 'TeamW' ||
    (pairings2[1].team_a as any).name !== 'TeamZ' ||
    (pairings2[1].team_b as any).name !== 'TeamY'
) {
    throw new Error('Test failed: standings array pairing did not match expected pairing')
}

// Uji error jika jumlah grup !== 2 (misal 3 grup atau 1 grup):
console.log('\n--- Test 3: Error handling untuk N grup !== 2 ---')

try {
    generateBracketPairing([
        { group: 'Group A', winner: teamX, runnerUp: teamY },
        { group: 'Group B', winner: teamZ, runnerUp: teamW },
        { group: 'Group C', winner: { id: 'team-c1', name: 'TeamC1' }, runnerUp: { id: 'team-c2', name: 'TeamC2' } },
    ])
    throw new Error('Test failed: should have thrown for 3 groups')
} catch (err: any) {
    console.log(`3 Grup error tertangkap: "${err.message}" (Expected: Pairing untuk 3 grup belum didukung)`)
    if (!err.message.includes('Pairing untuk 3 grup belum didukung')) {
        throw new Error(`Unexpected error message: ${err.message}`)
    }
}

try {
    generateBracketPairing([
        { group: 'Group A', winner: teamX, runnerUp: teamY },
    ])
    throw new Error('Test failed: should have thrown for 1 group')
} catch (err: any) {
    console.log(`1 Grup error tertangkap: "${err.message}" (Expected: Pairing untuk 1 grup belum didukung)`)
    if (!err.message.includes('Pairing untuk 1 grup belum didukung')) {
        throw new Error(`Unexpected error message: ${err.message}`)
    }
}

console.log('\n🎉 ALL BRACKET TESTS PASSED SUCCESSFULLY!')
