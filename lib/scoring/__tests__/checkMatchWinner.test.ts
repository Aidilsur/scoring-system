import { describe, it, expect } from 'vitest'
import { checkMatchWinner } from '../checkMatchWinner'

describe('checkMatchWinner', () => {
    it("1. round='group', gamesA=3, gamesB=1 → winner: 'team_a'", () => {
        expect(checkMatchWinner(3, 1, 'group')).toBe('team_a')
    })
    it("2. round='group', gamesA=1, gamesB=3 → winner: 'team_b'", () => {
        expect(checkMatchWinner(1, 3, 'group')).toBe('team_b')
    })
    it("3. round='group', gamesA=2, gamesB=2 → winner: null", () => {
        expect(checkMatchWinner(2, 2, 'group')).toBeNull()
    })
    it("4. round='semifinal', gamesA=6, gamesB=4 → winner: 'team_a'", () => {
        expect(checkMatchWinner(6, 4, 'semifinal')).toBe('team_a')
    })
    it("5. round='semifinal', gamesA=5, gamesB=5 → winner: null", () => {
        expect(checkMatchWinner(5, 5, 'semifinal')).toBeNull()
    })
    it("6. round='final', gamesA=6, gamesB=5 → winner: 'team_a'", () => {
        expect(checkMatchWinner(6, 5, 'final')).toBe('team_a')
    })
    it("7. round='third_place', gamesA=4, gamesB=6 → winner: 'team_b'", () => {
        expect(checkMatchWinner(4, 6, 'third_place')).toBe('team_b')
    })
})
