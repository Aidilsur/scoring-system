import { describe, it, expect } from 'vitest'
import { generateRoundRobinSchedule } from '../generateRoundRobinSchedule'

describe('generateRoundRobinSchedule', () => {
    it("1. generateRoundRobinSchedule(['A','B','C','D']) → menghasilkan 6 pasangan tanpa duplikat", () => {
        const result = generateRoundRobinSchedule(['A', 'B', 'C', 'D'])
        expect(result.length).toBe(6)

        // Verifikasi semua kombinasi ada
        const combinations = result.map(m => `${m.teamAId}-${m.teamBId}`)
        expect(combinations).toContain('A-B')
        expect(combinations).toContain('A-C')
        expect(combinations).toContain('A-D')
        expect(combinations).toContain('B-C')
        expect(combinations).toContain('B-D')
        expect(combinations).toContain('C-D')
    })

    it("2. generateRoundRobinSchedule(['A','B','C']) → 3 pasangan", () => {
        const result = generateRoundRobinSchedule(['A', 'B', 'C'])
        expect(result.length).toBe(3)
        const combinations = result.map(m => `${m.teamAId}-${m.teamBId}`)
        expect(combinations).toContain('A-B')
        expect(combinations).toContain('A-C')
        expect(combinations).toContain('B-C')
    })

    it("3. generateRoundRobinSchedule(['A','B']) → 1 pasangan (A vs B)", () => {
        const result = generateRoundRobinSchedule(['A', 'B'])
        expect(result.length).toBe(1)
        expect(result[0].teamAId).toBe('A')
        expect(result[0].teamBId).toBe('B')
    })

    it("4. generateRoundRobinSchedule(['A']) → 0 pasangan", () => {
        expect(generateRoundRobinSchedule(['A'])).toEqual([])
    })

    it("5. generateRoundRobinSchedule([]) → 0 pasangan", () => {
        expect(generateRoundRobinSchedule([])).toEqual([])
    })

    it("6. Untuk hasil test 1 (4 tim), verifikasi TIDAK ADA pasangan yang teamAId === teamBId", () => {
        const result = generateRoundRobinSchedule(['A', 'B', 'C', 'D'])
        const selfPlay = result.some(m => m.teamAId === m.teamBId)
        expect(selfPlay).toBe(false)
    })
})
