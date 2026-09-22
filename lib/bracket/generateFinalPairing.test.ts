import { describe, it, expect } from 'vitest'
import { generateFinalPairing } from './generateFinalPairing'

describe('generateFinalPairing', () => {
    it("1. 2 match semifinal valid, thirdPlaceEnabled=true", () => {
        const sf1 = { team_a_id: 'T1', team_b_id: 'T2', winner_team_id: 'T1' }
        const sf2 = { team_a_id: 'T3', team_b_id: 'T4', winner_team_id: 'T4' }
        
        const result = generateFinalPairing([sf1, sf2], true)
        expect(result).toEqual({
            final: { teamAId: 'T1', teamBId: 'T4' },
            thirdPlace: { teamAId: 'T2', teamBId: 'T3' }
        })
    })

    it("2. Sama seperti di atas tapi thirdPlaceEnabled=false → thirdPlace=null", () => {
        const sf1 = { team_a_id: 'T1', team_b_id: 'T2', winner_team_id: 'T1' }
        const sf2 = { team_a_id: 'T3', team_b_id: 'T4', winner_team_id: 'T4' }
        
        const result = generateFinalPairing([sf1, sf2], false)
        expect(result).toEqual({
            final: { teamAId: 'T1', teamBId: 'T4' },
            thirdPlace: null
        })
    })

    it("3. Format field alias (teamAId/teamBId/winnerTeamId) → hasil sama", () => {
        const sf1 = { teamAId: 'T1', teamBId: 'T2', winnerTeamId: 'T1' }
        const sf2 = { teamAId: 'T3', teamBId: 'T4', winnerTeamId: 'T4' }
        
        const result = generateFinalPairing([sf1, sf2], true)
        expect(result).toEqual({
            final: { teamAId: 'T1', teamBId: 'T4' },
            thirdPlace: { teamAId: 'T2', teamBId: 'T3' }
        })
    })

    it("4. Cuma 1 match semifinal diberikan → throw error", () => {
        const sf1 = { team_a_id: 'T1', team_b_id: 'T2', winner_team_id: 'T1' }
        expect(() => generateFinalPairing([sf1], true))
            .toThrow("Dibutuhkan tepat 2 match semifinal")
    })

    it("5. winner_team_id tidak cocok dengan team_a_id maupun team_b_id → throw error", () => {
        const sf1 = { team_a_id: 'T1', team_b_id: 'T2', winner_team_id: 'T1' }
        const sf2 = { team_a_id: 'T3', team_b_id: 'T4', winner_team_id: 'TX' } // TX tidak ada
        
        expect(() => generateFinalPairing([sf1, sf2], true))
            .toThrow("tidak cocok dengan tim A")
    })

    it("6. winner_team_id kosong/null → throw error", () => {
        const sf1 = { team_a_id: 'T1', team_b_id: 'T2', winner_team_id: 'T1' }
        const sf2 = { team_a_id: 'T3', team_b_id: 'T4', winner_team_id: null }
        
        expect(() => generateFinalPairing([sf1, sf2], true))
            .toThrow("belum memiliki pemenang")
    })

    it("7. team_a_id dan team_b_id keduanya kosong → throw error", () => {
        const sf1 = { team_a_id: 'T1', team_b_id: 'T2', winner_team_id: 'T1' }
        const sf2 = { team_a_id: null, team_b_id: null, winner_team_id: 'T4' }
        
        expect(() => generateFinalPairing([sf1, sf2], true))
            .toThrow("belum memiliki data tim yang valid")
    })
})
