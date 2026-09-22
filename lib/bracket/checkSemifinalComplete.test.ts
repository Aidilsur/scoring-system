import { describe, it, expect } from 'vitest'
import { checkSemifinalComplete } from './checkSemifinalComplete'

describe('checkSemifinalComplete', () => {
    it("1. Tepat 2 match round='semifinal', keduanya completed → true", () => {
        const matches = [
            { round: 'semifinal', status: 'completed' },
            { round: 'semifinal', status: 'completed' }
        ]
        expect(checkSemifinalComplete(matches)).toBe(true)
    })

    it("2. Tepat 2 match round='semifinal', salah satu masih 'live' → false", () => {
        const matches = [
            { round: 'semifinal', status: 'completed' },
            { round: 'semifinal', status: 'live' }
        ]
        expect(checkSemifinalComplete(matches)).toBe(false)
    })

    it("3. Cuma 1 match round='semifinal' yang completed → false", () => {
        const matches = [
            { round: 'semifinal', status: 'completed' }
        ]
        expect(checkSemifinalComplete(matches)).toBe(false)
    })

    it("4. 3 match round='semifinal' semua completed → false", () => {
        const matches = [
            { round: 'semifinal', status: 'completed' },
            { round: 'semifinal', status: 'completed' },
            { round: 'semifinal', status: 'completed' }
        ]
        expect(checkSemifinalComplete(matches)).toBe(false)
    })

    it("5. Array kosong → false", () => {
        expect(checkSemifinalComplete([])).toBe(false)
    })
})
