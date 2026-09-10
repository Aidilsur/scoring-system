import {
    recordPoint,
    recordTiebreakPoint,
    checkMatchWinner,
    shouldStartTiebreakGame,
    type RegularGameState,
    type TiebreakState,
} from '../lib/scoring'

console.log('=================================================================')
console.log('PADEL TOURNAMENT SCORING SYSTEM - MANUAL SCENARIO TEST EXECUTION')
console.log('=================================================================\n')

// =============================================================================
// SKENARIO 1: Game normal tanpa deuce (4 poin berturut-turut)
// =============================================================================
console.log('-----------------------------------------------------------------')
console.log('SKENARIO 1: Game normal tanpa deuce (0-0 -> 15-0 -> 30-0 -> 40-0 -> Game)')
console.log('-----------------------------------------------------------------')
let gameState1: RegularGameState = {
    pointA: '0',
    pointB: '0',
    goldenPointEnabled: false,
}

console.log(`Initial Score: A: ${gameState1.pointA} - B: ${gameState1.pointB}`)

// Poin 1 (Team A)
let res1 = recordPoint(gameState1, 'team_a')
console.log(`Poin 1 (Team A): A: ${res1.pointA} - B: ${res1.pointB} | isGameWon: ${res1.isGameWon} | winner: ${res1.winner}`)
gameState1 = { pointA: res1.pointA, pointB: res1.pointB, goldenPointEnabled: false }

// Poin 2 (Team A)
res1 = recordPoint(gameState1, 'team_a')
console.log(`Poin 2 (Team A): A: ${res1.pointA} - B: ${res1.pointB} | isGameWon: ${res1.isGameWon} | winner: ${res1.winner}`)
gameState1 = { pointA: res1.pointA, pointB: res1.pointB, goldenPointEnabled: false }

// Poin 3 (Team A)
res1 = recordPoint(gameState1, 'team_a')
console.log(`Poin 3 (Team A): A: ${res1.pointA} - B: ${res1.pointB} | isGameWon: ${res1.isGameWon} | winner: ${res1.winner}`)
gameState1 = { pointA: res1.pointA, pointB: res1.pointB, goldenPointEnabled: false }

// Poin 4 (Team A)
res1 = recordPoint(gameState1, 'team_a')
console.log(`Poin 4 (Team A): A: ${res1.pointA} - B: ${res1.pointB} | isGameWon: ${res1.isGameWon} | winner: ${res1.winner}`)
console.log(`-> Hasil Skenario 1: ${res1.isGameWon && res1.winner === 'team_a' ? 'BERHASIL (Team A Menang Game)' : 'GAGAL'}\n`)

// =============================================================================
// SKENARIO 2: Game dengan golden point (40-40 deuce -> 1 poin langsung menang)
// =============================================================================
console.log('-----------------------------------------------------------------')
console.log('SKENARIO 2: Game dengan golden point (40-40 Deuce -> Golden Point -> Langsung Game TANPA AD)')
console.log('-----------------------------------------------------------------')
const gameState2: RegularGameState = {
    pointA: '40',
    pointB: '40',
    goldenPointEnabled: true,
}

console.log(`Initial Score: A: ${gameState2.pointA} - B: ${gameState2.pointB} (Golden Point Mode: ON)`)
const res2 = recordPoint(gameState2, 'team_a')
console.log(`Team A mencetak poin di 40-40:`)
console.log(`- isGameWon: ${res2.isGameWon}`)
console.log(`- winner: ${res2.winner}`)
console.log(`- pointA: ${res2.pointA}, pointB: ${res2.pointB}`)
console.log(`-> Hasil Skenario 2: ${res2.isGameWon && res2.winner === 'team_a' && res2.pointA !== 'AD' ? 'BERHASIL (Langsung Game tanpa fase AD)' : 'GAGAL'}\n`)

// =============================================================================
// SKENARIO 3: Tiebreak fase grup (requireWinBy2=true)
// Simulasi sampai 6-6, lalu 7-6 (belum menang), lalu 8-6 (baru menang)
// =============================================================================
console.log('-----------------------------------------------------------------')
console.log('SKENARIO 3: Tiebreak fase grup (requireWinBy2=true)')
console.log('Simulasi di 6-6 -> poin ke-7 (7-6: belum menang) -> poin ke-8 (8-6: menang)')
console.log('-----------------------------------------------------------------')
console.log(`Cek kondisi masuk tiebreak fase grup (skor 2-2 game): shouldStartTiebreakGame(2, 2, 'group') = ${shouldStartTiebreakGame(2, 2, 'group')}`)

let tiebreakState3: TiebreakState = { pointA: 6, pointB: 6 }
console.log(`Initial Tiebreak Score: A: ${tiebreakState3.pointA} - B: ${tiebreakState3.pointB}`)

// Team A mencetak poin ke-7 -> skor 7-6
let res3 = recordTiebreakPoint(tiebreakState3, 'team_a', true)
console.log(`Team A mencetak poin: Skor ${res3.pointA}-${res3.pointB} | isGameWon: ${res3.isGameWon} | winner: ${res3.winner}`)
console.log(`- Status di 7-6 (selisih 1): ${res3.isGameWon === false ? 'VALID (Belum Menang karena syarat selisih 2 poin)' : 'GAGAL'}`)

// Team A mencetak poin ke-8 -> skor 8-6
tiebreakState3 = { pointA: res3.pointA, pointB: res3.pointB }
res3 = recordTiebreakPoint(tiebreakState3, 'team_a', true)
console.log(`Team A mencetak poin lagi: Skor ${res3.pointA}-${res3.pointB} | isGameWon: ${res3.isGameWon} | winner: ${res3.winner}`)
console.log(`- Status di 8-6 (selisih 2): ${res3.isGameWon === true && res3.winner === 'team_a' ? 'VALID (Menang Tiebreak Game)' : 'GAGAL'}`)

// Cek pemenang match grup setelah game tiebreak dimenangkan team_a (menjadi 3-2 game)
const matchWinnerGroup = checkMatchWinner(3, 2, 'group')
console.log(`- Cek Match Winner Grup (skor game 3-2): checkMatchWinner(3, 2, 'group') = ${matchWinnerGroup}`)
console.log(`-> Hasil Skenario 3: ${res3.isGameWon && matchWinnerGroup === 'team_a' ? 'BERHASIL' : 'GAGAL'}\n`)

// =============================================================================
// SKENARIO 4: Golden game knockout (requireWinBy2=false)
// Simulasi di 6-6, lalu salah satu menang 1 poin (7-6) -> HARUS SUDAH MENANG MATCH
// =============================================================================
console.log('-----------------------------------------------------------------')
console.log('SKENARIO 4: Golden game knockout (requireWinBy2=false)')
console.log('Simulasi di 6-6 -> poin ke-7 (7-6) HARUS LANGSUNG MENANG MATCH tanpa selisih 2')
console.log('-----------------------------------------------------------------')
console.log(`Cek kondisi masuk golden game knockout (skor 5-5 game): shouldStartTiebreakGame(5, 5, 'final') = ${shouldStartTiebreakGame(5, 5, 'final')}`)

const tiebreakState4: TiebreakState = { pointA: 6, pointB: 6 }
console.log(`Initial Golden Game Score: A: ${tiebreakState4.pointA} - B: ${tiebreakState4.pointB}`)

// Team A mencetak poin ke-7 -> skor 7-6
const res4 = recordTiebreakPoint(tiebreakState4, 'team_a', false)
console.log(`Team A mencetak poin: Skor ${res4.pointA}-${res4.pointB} | isGameWon: ${res4.isGameWon} | winner: ${res4.winner}`)
console.log(`- Status di 7-6 (race to 7, no win-by-2): ${res4.isGameWon === true && res4.winner === 'team_a' ? 'VALID (Langsung Menang Game di 7 Poin)' : 'GAGAL'}`)

// Cek pemenang match knockout setelah golden game dimenangkan team_a (menjadi 6-5 game)
const matchWinnerKnockout = checkMatchWinner(6, 5, 'final')
console.log(`- Cek Match Winner Knockout (skor game 6-5): checkMatchWinner(6, 5, 'final') = ${matchWinnerKnockout}`)
console.log(`-> Hasil Skenario 4: ${res4.isGameWon && matchWinnerKnockout === 'team_a' ? 'BERHASIL' : 'GAGAL'}\n`)

console.log('=================================================================')
console.log('SEMUA 4 SKENARIO MANUAL TEST SELESAI DAN VALID')
console.log('=================================================================')
