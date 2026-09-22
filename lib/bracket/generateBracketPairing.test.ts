import { describe, it, expect } from 'vitest'
import { generateBracketPairing } from './generateBracketPairing'

describe('generateBracketPairing', () => {
    it("1. 2 grup dengan format {winner, runnerUp} → pola silang A1xB2, B1xA2", () => {
        const groupA = { winner: 'TeamA1', runnerUp: 'TeamA2' }
        const groupB = { winner: 'TeamB1', runnerUp: 'TeamB2' }
        
        const result = generateBracketPairing([groupA, groupB])
        expect(result).toEqual([
            { matchNumber: 1, round: 'semifinal', team_a: 'TeamA1', team_b: 'TeamB2' },
            { matchNumber: 2, round: 'semifinal', team_a: 'TeamB1', team_b: 'TeamA2' }
        ])
    })

    it("2. Sama seperti di atas tapi pakai format {juara, runner_up} → hasil pairing SAMA", () => {
        const groupA = { juara: 'TeamA1', runner_up: 'TeamA2' }
        const groupB = { juara: 'TeamB1', runner_up: 'TeamB2' }
        
        const result = generateBracketPairing([groupA, groupB])
        expect(result).toEqual([
            { matchNumber: 1, round: 'semifinal', team_a: 'TeamA1', team_b: 'TeamB2' },
            { matchNumber: 2, round: 'semifinal', team_a: 'TeamB1', team_b: 'TeamA2' }
        ])
    })

    it("3. Format pakai standings array → winner index 0, runnerUp index 1", () => {
        const groupA = { standings: [{ team: 'TeamA1' }, { team: 'TeamA2' }] }
        const groupB = { standings: [{ team: 'TeamB1' }, { team: 'TeamB2' }] }
        
        const result = generateBracketPairing([groupA, groupB])
        expect(result).toEqual([
            { matchNumber: 1, round: 'semifinal', team_a: 'TeamA1', team_b: 'TeamB2' },
            { matchNumber: 2, round: 'semifinal', team_a: 'TeamB1', team_b: 'TeamA2' }
        ])
    })

    it("4. Dipanggil dengan 1 grup saja → throw error", () => {
        expect(() => generateBracketPairing([{ winner: 'TeamA1', runnerUp: 'TeamA2' }]))
            .toThrow("Pairing untuk 1 grup belum didukung")
    })

    it("5. Dipanggil dengan 3 grup → throw error", () => {
        const group = { winner: 'W', runnerUp: 'R' }
        expect(() => generateBracketPairing([group, group, group]))
            .toThrow("Pairing untuk 3 grup belum didukung")
    })

    it("6. Dipanggil dengan array kosong → throw error", () => {
        expect(() => generateBracketPairing([]))
            .toThrow("Pairing untuk 0 grup belum didukung")
    })

    it("7. Grup dengan standings cuma 1 tim → throw error", () => {
        const groupA = { standings: [{ team: 'TeamA1' }] }
        const groupB = { winner: 'TeamB1', runnerUp: 'TeamB2' }
        
        expect(() => generateBracketPairing([groupA, groupB]))
            .toThrow("belum lengkap")
    })
})
