import { describe, it, expect } from 'vitest'
import { recordPoint } from './recordPoint'
import type { RegularGameState } from './types'

describe('recordPoint', () => {
    describe('Kelompok 1 - Progresi Poin Normal (belum deuce)', () => {
        it("1. State awal {pointA: '0', pointB: '0'}, team_a menang poin → expect pointA: '15', pointB: '0', isGameWon: false, winner: null", () => {
            const state: RegularGameState = { pointA: '0', pointB: '0', goldenPointEnabled: false }
            const result = recordPoint(state, 'team_a')
            expect(result).toEqual({ pointA: '15', pointB: '0', isGameWon: false, winner: null })
        })

        it("2. State {pointA: '15', pointB: '0'}, team_a menang poin lagi → pointA: '30'", () => {
            const state: RegularGameState = { pointA: '15', pointB: '0', goldenPointEnabled: false }
            const result = recordPoint(state, 'team_a')
            expect(result).toEqual({ pointA: '30', pointB: '0', isGameWon: false, winner: null })
        })

        it("3. State {pointA: '30', pointB: '15'}, team_a menang poin → pointA: '40'", () => {
            const state: RegularGameState = { pointA: '30', pointB: '15', goldenPointEnabled: false }
            const result = recordPoint(state, 'team_a')
            expect(result).toEqual({ pointA: '40', pointB: '15', isGameWon: false, winner: null })
        })

        it("4. State {pointA: '40', pointB: '0'}, team_a menang poin → isGameWon: true, winner: 'team_a'", () => {
            const state: RegularGameState = { pointA: '40', pointB: '0', goldenPointEnabled: false }
            const result = recordPoint(state, 'team_a')
            expect(result).toEqual({ pointA: '0', pointB: '0', isGameWon: true, winner: 'team_a' })
        })
    })

    describe('Kelompok 2 - Deuce dengan Golden Point ENABLED', () => {
        it("5. State {pointA: '40', pointB: '40', goldenPointEnabled: true}, team_a menang poin → expect isGameWon: true, winner: 'team_a'", () => {
            const state: RegularGameState = { pointA: '40', pointB: '40', goldenPointEnabled: true }
            const result = recordPoint(state, 'team_a')
            expect(result).toEqual({ pointA: '0', pointB: '0', isGameWon: true, winner: 'team_a' })
        })

        it("6. Sama seperti di atas tapi team_b yang menang poin → winner: 'team_b'", () => {
            const state: RegularGameState = { pointA: '40', pointB: '40', goldenPointEnabled: true }
            const result = recordPoint(state, 'team_b')
            expect(result).toEqual({ pointA: '0', pointB: '0', isGameWon: true, winner: 'team_b' })
        })
    })

    describe('Kelompok 3 - Deuce dengan Golden Point DISABLED (mode advantage normal)', () => {
        it("7. State {pointA: '40', pointB: '40', goldenPointEnabled: false}, team_a menang poin → expect pointA: 'AD', pointB: '40', isGameWon: false, winner: null", () => {
            const state: RegularGameState = { pointA: '40', pointB: '40', goldenPointEnabled: false }
            const result = recordPoint(state, 'team_a')
            expect(result).toEqual({ pointA: 'AD', pointB: '40', isGameWon: false, winner: null })
        })

        it("8. State {pointA: 'AD', pointB: '40', goldenPointEnabled: false}, team_a menang poin lagi → expect isGameWon: true, winner: 'team_a'", () => {
            const state: RegularGameState = { pointA: 'AD', pointB: '40', goldenPointEnabled: false }
            const result = recordPoint(state, 'team_a')
            expect(result).toEqual({ pointA: '0', pointB: '0', isGameWon: true, winner: 'team_a' })
        })

        it("9. State {pointA: 'AD', pointB: '40', goldenPointEnabled: false}, team_b yang menang poin → expect kembali ke pointA: '40', pointB: '40'", () => {
            const state: RegularGameState = { pointA: 'AD', pointB: '40', goldenPointEnabled: false }
            const result = recordPoint(state, 'team_b')
            expect(result).toEqual({ pointA: '40', pointB: '40', isGameWon: false, winner: null })
        })
    })

    describe('Kelompok 4 - Edge case', () => {
        it("10. State {pointA: '0', pointB: '40'}, team_b menang poin → team_b langsung menang game", () => {
            const state: RegularGameState = { pointA: '0', pointB: '40', goldenPointEnabled: false }
            const result = recordPoint(state, 'team_b')
            expect(result).toEqual({ pointA: '0', pointB: '0', isGameWon: true, winner: 'team_b' })
        })
    })
})
