import { describe, it, expect } from 'vitest'
import { distributeTeamsToGroups } from './distributeTeamsToGroups'

describe('distributeTeamsToGroups', () => {
    describe('Habis dibagi rata', () => {
        it('1. distributeTeamsToGroups(16, 4) → [4, 4, 4, 4]', () => {
            expect(distributeTeamsToGroups(16, 4)).toEqual([4, 4, 4, 4])
        })
        it('2. distributeTeamsToGroups(8, 4) → [4, 4]', () => {
            expect(distributeTeamsToGroups(8, 4)).toEqual([4, 4])
        })
        it('3. distributeTeamsToGroups(12, 4) → [4, 4, 4]', () => {
            expect(distributeTeamsToGroups(12, 4)).toEqual([4, 4, 4])
        })
    })

    describe('Tidak habis dibagi rata', () => {
        it('4. distributeTeamsToGroups(14, 4) → [5, 5, 4]', () => {
            expect(distributeTeamsToGroups(14, 4)).toEqual([5, 5, 4])
        })
        it('5. distributeTeamsToGroups(15, 4) → [4, 4, 4, 3]', () => {
            expect(distributeTeamsToGroups(15, 4)).toEqual([4, 4, 4, 3])
        })
        it('6. distributeTeamsToGroups(17, 4) → [5, 4, 4, 4]', () => {
            expect(distributeTeamsToGroups(17, 4)).toEqual([5, 4, 4, 4])
        })
        it('7. distributeTeamsToGroups(18, 4) → [5, 5, 4, 4]', () => {
            expect(distributeTeamsToGroups(18, 4)).toEqual([5, 5, 4, 4])
        })
        it('8. distributeTeamsToGroups(19, 4) → [4, 4, 4, 4, 3]', () => {
            expect(distributeTeamsToGroups(19, 4)).toEqual([4, 4, 4, 4, 3])
        })
        it('9. distributeTeamsToGroups(10, 4) → [5, 5]', () => {
            expect(distributeTeamsToGroups(10, 4)).toEqual([5, 5])
        })
        it('10. distributeTeamsToGroups(7, 4) → [4, 3]', () => {
            expect(distributeTeamsToGroups(7, 4)).toEqual([4, 3])
        })
        it('11. distributeTeamsToGroups(6, 4) → [3, 3]', () => {
            expect(distributeTeamsToGroups(6, 4)).toEqual([3, 3])
        })
        it('12. distributeTeamsToGroups(3, 4) → [3]', () => {
            expect(distributeTeamsToGroups(3, 4)).toEqual([3])
        })
    })

    describe('Edge cases', () => {
        it('13. distributeTeamsToGroups(0, 4) → []', () => {
            expect(distributeTeamsToGroups(0, 4)).toEqual([])
        })
        it('14. distributeTeamsToGroups(5, 0) → []', () => {
            expect(distributeTeamsToGroups(5, 0)).toEqual([])
        })
    })

    describe('Tambahan - verifikasi invariant', () => {
        it('Total elemen dalam array hasil (jumlah seluruh slot grup) harus selalu sama dengan teamCount input', () => {
            const counts = [1, 5, 9, 13, 21, 23, 100]
            for (const c of counts) {
                const result = distributeTeamsToGroups(c, 4)
                const sum = result.reduce((acc, val) => acc + val, 0)
                expect(sum).toBe(c)
            }
        })
        it('Array hasil distribusi grup harus selalu terurut secara descending (ukuran besar di depan)', () => {
            const result = distributeTeamsToGroups(23, 4)
            for (let i = 0; i < result.length - 1; i++) {
                expect(result[i]).toBeGreaterThanOrEqual(result[i + 1])
            }
        })
    })
})
