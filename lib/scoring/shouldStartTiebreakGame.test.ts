import { describe, it, expect } from 'vitest'
import { shouldStartTiebreakGame } from './shouldStartTiebreakGame'

describe('shouldStartTiebreakGame', () => {
    it("1. round='group', gamesA=2, gamesB=2 → true", () => {
        expect(shouldStartTiebreakGame(2, 2, 'group')).toBe(true)
    })
    it("2. round='group', gamesA=1, gamesB=1 → false", () => {
        expect(shouldStartTiebreakGame(1, 1, 'group')).toBe(false)
    })
    it("3. round='group', gamesA=3, gamesB=2 → false", () => {
        expect(shouldStartTiebreakGame(3, 2, 'group')).toBe(false)
    })
    it("4. round='semifinal', gamesA=5, gamesB=5 → true", () => {
        expect(shouldStartTiebreakGame(5, 5, 'semifinal')).toBe(true)
    })
    it("5. round='final', gamesA=4, gamesB=4 → false", () => {
        expect(shouldStartTiebreakGame(4, 4, 'final')).toBe(false)
    })
    it("6. round='third_place', gamesA=5, gamesB=5 → true", () => {
        expect(shouldStartTiebreakGame(5, 5, 'third_place')).toBe(true)
    })
})
