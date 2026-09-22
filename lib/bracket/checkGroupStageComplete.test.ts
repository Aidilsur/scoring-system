import { describe, it, expect } from 'vitest'
import { checkGroupStageComplete } from './checkGroupStageComplete'

describe('checkGroupStageComplete', () => {
    it("1. Semua match round='group' berstatus 'completed' → true", () => {
        const matches = [
            { round: 'group' as const, status: 'completed' as const },
            { round: 'group' as const, status: 'completed' as const }
        ]
        expect(checkGroupStageComplete(matches)).toBe(true)
    })

    it("2. Ada 1 match round='group' berstatus 'scheduled' → false", () => {
        const matches = [
            { round: 'group' as const, status: 'completed' as const },
            { round: 'group' as const, status: 'scheduled' as const }
        ]
        expect(checkGroupStageComplete(matches)).toBe(false)
    })

    it("3. Array kosong → false", () => {
        expect(checkGroupStageComplete([])).toBe(false)
    })

    it("4. Match campuran round tapi SEMUA yang round='group' sudah completed → true", () => {
        const matches = [
            { round: 'group' as const, status: 'completed' as const },
            { round: 'semifinal' as const, status: 'scheduled' as const }
        ]
        expect(checkGroupStageComplete(matches)).toBe(true)
    })

    it("5. Tidak ada match dengan round='group' sama sekali → false", () => {
        const matches = [
            { round: 'semifinal' as const, status: 'completed' as const },
            { round: 'final' as const, status: 'completed' as const }
        ]
        expect(checkGroupStageComplete(matches)).toBe(false)
    })
})
