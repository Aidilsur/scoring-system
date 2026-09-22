import { describe, it, expect } from 'vitest'
import { generateGroupDraw } from './generateGroupDraw'
import type { Team } from '@/types/domain'

function createMockTeams(count: number): Team[] {
    const teams: Team[] = []
    for (let i = 1; i <= count; i++) {
        teams.push({
            id: `team-${i}`,
            category_id: 'cat-1',
            player1_name: `P1-${i}`,
            player2_name: `P2-${i}`,
            phone_number: '000',
            payment_proof_url: 'url',
            status: 'confirmed',
            created_at: new Date().toISOString()
        })
    }
    return teams
}

describe('generateGroupDraw', () => {
    it('1. Dengan 8 tim mock dan groupSizes=[4,4] → hasil harus 2 grup berisi tepat 4 tim unik', () => {
        const teams = createMockTeams(8)
        const sizes = [4, 4]
        const result = generateGroupDraw(teams, sizes)

        expect(result.length).toBe(2)
        expect(result[0].teams.length).toBe(4)
        expect(result[1].teams.length).toBe(4)

        const allIds = result.flatMap(g => g.teams.map(t => t.id))
        const uniqueIds = new Set(allIds)
        expect(uniqueIds.size).toBe(8)
        expect(allIds.length).toBe(8)
    })

    it('2. Dengan groupSizes=[5,5,4] (14 tim) → nama grup harus "Group A", "Group B", "Group C"', () => {
        const teams = createMockTeams(14)
        const sizes = [5, 5, 4]
        const result = generateGroupDraw(teams, sizes)
        expect(result.map(g => g.name)).toEqual(['Group A', 'Group B', 'Group C'])
    })

    it('3. teams=[] atau groupSizes=[] → return array kosong', () => {
        expect(generateGroupDraw([], [4, 4])).toEqual([])
        expect(generateGroupDraw(createMockTeams(8), [])).toEqual([])
        expect(generateGroupDraw([], [])).toEqual([])
    })

    it('4. Jalankan fungsi 20 kali dengan input SAMA → verifikasi TIDAK SEMUA hasil identik urutannya', () => {
        const teams = createMockTeams(8)
        const sizes = [4, 4]

        let isDifferent = false
        const firstResultIds = generateGroupDraw(teams, sizes)[0].teams.map(t => t.id).join(',')

        for (let i = 0; i < 20; i++) {
            const resultIds = generateGroupDraw(teams, sizes)[0].teams.map(t => t.id).join(',')
            if (resultIds !== firstResultIds) {
                isDifferent = true
                break
            }
        }
        
        expect(isDifferent).toBe(true)
    })

    it('5. Test formatGroupName secara tidak langsung: dengan groupSizes 27 elemen, verifikasi nama grup ke-27 adalah "Group AA"', () => {
        const teams = createMockTeams(27)
        const sizes = Array(27).fill(1)
        const result = generateGroupDraw(teams, sizes)
        expect(result[26].name).toBe('Group AA')
    })
})
