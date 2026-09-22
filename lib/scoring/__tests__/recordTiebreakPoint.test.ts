import { describe, it, expect } from 'vitest'
import { recordTiebreakPoint } from '../recordTiebreakPoint'

describe('recordTiebreakPoint', () => {
    describe('Kelompok 1 - requireWinBy2 = true (tiebreak fase grup)', () => {
        it("1. {pointA: 6, pointB: 5}, team_a menang poin, requireWinBy2=true → pointA: 7, pointB: 5, isGameWon: true, winner: 'team_a'", () => {
            const result = recordTiebreakPoint({ pointA: 6, pointB: 5 }, 'team_a', true)
            expect(result).toEqual({ pointA: 7, pointB: 5, isGameWon: true, winner: 'team_a' })
        })
        it("2. {pointA: 6, pointB: 6}, team_a menang poin, requireWinBy2=true → pointA: 7, pointB: 6, isGameWon: false, winner: null", () => {
            const result = recordTiebreakPoint({ pointA: 6, pointB: 6 }, 'team_a', true)
            expect(result).toEqual({ pointA: 7, pointB: 6, isGameWon: false, winner: null })
        })
        it("3. {pointA: 7, pointB: 6}, team_a menang poin lagi, requireWinBy2=true → pointA: 8, pointB: 6, isGameWon: true, winner: 'team_a'", () => {
            const result = recordTiebreakPoint({ pointA: 7, pointB: 6 }, 'team_a', true)
            expect(result).toEqual({ pointA: 8, pointB: 6, isGameWon: true, winner: 'team_a' })
        })
        it("4. {pointA: 5, pointB: 6}, team_b menang poin, requireWinBy2=true → pointA: 5, pointB: 7, isGameWon: true, winner: 'team_b'", () => {
            const result = recordTiebreakPoint({ pointA: 5, pointB: 6 }, 'team_b', true)
            expect(result).toEqual({ pointA: 5, pointB: 7, isGameWon: true, winner: 'team_b' })
        })
    })

    describe('Kelompok 2 - requireWinBy2 = false (golden game knockout)', () => {
        it("5. {pointA: 6, pointB: 6}, team_a menang poin, requireWinBy2=false → pointA: 7, pointB: 6, isGameWon: true, winner: 'team_a'", () => {
            const result = recordTiebreakPoint({ pointA: 6, pointB: 6 }, 'team_a', false)
            expect(result).toEqual({ pointA: 7, pointB: 6, isGameWon: true, winner: 'team_a' })
        })
        it("6. {pointA: 6, pointB: 0}, team_a menang poin, requireWinBy2=false → pointA: 7, pointB: 0, isGameWon: true, winner: 'team_a'", () => {
            const result = recordTiebreakPoint({ pointA: 6, pointB: 0 }, 'team_a', false)
            expect(result).toEqual({ pointA: 7, pointB: 0, isGameWon: true, winner: 'team_a' })
        })
    })

    describe('Kelompok 3 - Edge case', () => {
        it("7. {pointA: 3, pointB: 2}, team_a menang poin, requireWinBy2=true → pointA: 4, pointB: 2, isGameWon: false, winner: null", () => {
            const result = recordTiebreakPoint({ pointA: 3, pointB: 2 }, 'team_a', true)
            expect(result).toEqual({ pointA: 4, pointB: 2, isGameWon: false, winner: null })
        })
        it("8. {pointA: 0, pointB: 0}, team_b menang poin, requireWinBy2=false → pointA: 0, pointB: 1, isGameWon: false, winner: null", () => {
            const result = recordTiebreakPoint({ pointA: 0, pointB: 0 }, 'team_b', false)
            expect(result).toEqual({ pointA: 0, pointB: 1, isGameWon: false, winner: null })
        })
    })
})
