import { describe, it, expect } from 'vitest'
import { sortGroupStandings } from '../sortStandings'
import type { StandingRow, Match } from '@/types/domain'

function createMockStandingRow(overrides?: Partial<StandingRow>): StandingRow {
    return {
        group_id: 'group-1',
        team_id: 'team-1',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        points: 0,
        games_for: 0,
        games_against: 0,
        game_diff: 0,
        ...overrides,
    }
}

function createMockMatch(overrides?: Partial<Match>): Match {
    return {
        id: 'match-1',
        category_id: 'cat-1',
        round: 'group',
        team_a_id: 'team-A',
        team_b_id: 'team-B',
        status: 'completed',
        games_team_a: 0,
        games_team_b: 0,
        current_point_a: '0',
        current_point_b: '0',
        winner_team_id: null,
        completed_at: null,
        court_id: null,
        group_id: null,
        scheduled_time: null,
        active_scorer_session_id: null,
        active_scorer_claimed_at: null,
        ...overrides,
    }
}

describe('sortGroupStandings', () => {
    describe('Kelompok 1 - Sorting dasar berdasarkan poin', () => {
        it('1. 3 tim dengan poin beda → urutan sesuai poin, flag winner/runnerUp/qualified benar', () => {
            const t1 = createMockStandingRow({ team_id: 'T1', points: 9 })
            const t2 = createMockStandingRow({ team_id: 'T2', points: 6 })
            const t3 = createMockStandingRow({ team_id: 'T3', points: 3 })
            
            // Urutan input diacak untuk memastikan sort bekerja
            const { standings } = sortGroupStandings([t2, t3, t1], [])
            
            expect(standings[0].team_id).toBe('T1')
            expect(standings[0].rank).toBe(1)
            expect(standings[0].isWinner).toBe(true)
            expect(standings[0].isRunnerUp).toBe(false)
            expect(standings[0].isQualified).toBe(true)

            expect(standings[1].team_id).toBe('T2')
            expect(standings[1].rank).toBe(2)
            expect(standings[1].isWinner).toBe(false)
            expect(standings[1].isRunnerUp).toBe(true)
            expect(standings[1].isQualified).toBe(true)

            expect(standings[2].team_id).toBe('T3')
            expect(standings[2].rank).toBe(3)
            expect(standings[2].isWinner).toBe(false)
            expect(standings[2].isRunnerUp).toBe(false)
            expect(standings[2].isQualified).toBe(false)
        })
    })

    describe('Kelompok 2 - Head-to-head MENGALAHKAN game_diff', () => {
        it('2. T1 & T2 poin sama, T2 game_diff lebih bagus tapi T1 menang H2H → T1 rank1', () => {
            const t1 = createMockStandingRow({ team_id: 'T1', points: 6, game_diff: 5 })
            const t2 = createMockStandingRow({ team_id: 'T2', points: 6, game_diff: 8 })
            const match = createMockMatch({ team_a_id: 'T1', team_b_id: 'T2', winner_team_id: 'T1' })

            const { standings } = sortGroupStandings([t2, t1], [match])
            
            expect(standings[0].team_id).toBe('T1')
            expect(standings[0].rank).toBe(1)
            expect(standings[1].team_id).toBe('T2')
            expect(standings[1].rank).toBe(2)
        })
    })

    describe('Kelompok 3 - Tanpa head-to-head, jatuh ke game_diff', () => {
        it('3. T1 & T2 poin sama, tanpa match H2H → jatuh ke game_diff', () => {
            const t1 = createMockStandingRow({ team_id: 'T1', points: 6, game_diff: 5 })
            const t2 = createMockStandingRow({ team_id: 'T2', points: 6, game_diff: 8 })

            const { standings } = sortGroupStandings([t1, t2], []) // tanpa match
            
            expect(standings[0].team_id).toBe('T2') // T2 lebih tinggi
            expect(standings[1].team_id).toBe('T1')
        })
    })

    describe('Kelompok 4 - Tie poin & game_diff, jatuh ke games_for', () => {
        it('4. T1 & T2 poin sama, game_diff sama, tanpa H2H → jatuh ke games_for', () => {
            const t1 = createMockStandingRow({ team_id: 'T1', points: 6, game_diff: 3, games_for: 10 })
            const t2 = createMockStandingRow({ team_id: 'T2', points: 6, game_diff: 3, games_for: 12 })

            const { standings } = sortGroupStandings([t1, t2], [])
            
            expect(standings[0].team_id).toBe('T2')
            expect(standings[1].team_id).toBe('T1')
        })
    })

    describe('Kelompok 5 - Manual decision TRIGGERED', () => {
        it('5. Tie total di posisi kelolosan (2-3) tanpa H2H → trigger manual decision', () => {
            const t1 = createMockStandingRow({ team_id: 'T1', points: 9, played: 1 })
            const t2 = createMockStandingRow({ team_id: 'T2', points: 6, game_diff: 2, games_for: 8, played: 1 })
            const t3 = createMockStandingRow({ team_id: 'T3', points: 6, game_diff: 2, games_for: 8, played: 1 })
            const t4 = createMockStandingRow({ team_id: 'T4', points: 3, played: 1 })

            const { standings, hasTieRequiringManualDecision } = sortGroupStandings([t1, t2, t3, t4], [])

            expect(hasTieRequiringManualDecision).toBe(true)
            
            const s1 = standings.find(s => s.team_id === 'T1')!
            const s2 = standings.find(s => s.team_id === 'T2')!
            const s3 = standings.find(s => s.team_id === 'T3')!
            const s4 = standings.find(s => s.team_id === 'T4')!

            expect(s1.needsManualDecision).toBe(false)
            expect(s2.needsManualDecision).toBe(true)
            expect(s3.needsManualDecision).toBe(true)
            expect(s4.needsManualDecision).toBe(false)
        })
    })

    describe('Kelompok 6 - Tie TIDAK di posisi kelolosan (rank>3)', () => {
        it('6. Tie di rank 4-5 → TIDAK trigger manual decision', () => {
            const t1 = createMockStandingRow({ team_id: 'T1', points: 9, played: 1 })
            const t2 = createMockStandingRow({ team_id: 'T2', points: 6, played: 1 })
            const t3 = createMockStandingRow({ team_id: 'T3', points: 4, played: 1 })
            const t4 = createMockStandingRow({ team_id: 'T4', points: 1, game_diff: 0, games_for: 0, played: 1 })
            const t5 = createMockStandingRow({ team_id: 'T5', points: 1, game_diff: 0, games_for: 0, played: 1 })

            const { standings, hasTieRequiringManualDecision } = sortGroupStandings([t1, t2, t3, t4, t5], [])

            expect(hasTieRequiringManualDecision).toBe(false)

            const s4 = standings.find(s => s.team_id === 'T4')!
            const s5 = standings.find(s => s.team_id === 'T5')!

            expect(s4.needsManualDecision).toBe(false)
            expect(s5.needsManualDecision).toBe(false)
        })
    })

    describe('Kelompok 7 - Tie tapi played=0', () => {
        it('7. 2 tim identik tapi belum pernah main (played=0) → TIDAK trigger manual decision', () => {
            const t1 = createMockStandingRow({ team_id: 'T1', points: 0, game_diff: 0, games_for: 0, played: 0 })
            const t2 = createMockStandingRow({ team_id: 'T2', points: 0, game_diff: 0, games_for: 0, played: 0 })

            const { standings, hasTieRequiringManualDecision } = sortGroupStandings([t1, t2], [])

            expect(hasTieRequiringManualDecision).toBe(false)
            expect(standings[0].needsManualDecision).toBe(false)
            expect(standings[1].needsManualDecision).toBe(false)
        })
    })

    describe('Kelompok 8 - PENTING: h2h yang valid MEMBATALKAN flag manual decision', () => {
        it('8. T1 & T2 identik total, TAPI ada valid H2H → needsManualDecision=false untuk KEDUANYA', () => {
            const t1 = createMockStandingRow({ team_id: 'T1', points: 6, game_diff: 3, games_for: 10, played: 1 })
            const t2 = createMockStandingRow({ team_id: 'T2', points: 6, game_diff: 3, games_for: 10, played: 1 })
            
            // H2H match, T1 wins
            const match = createMockMatch({ team_a_id: 'T1', team_b_id: 'T2', winner_team_id: 'T1' })

            const { standings, hasTieRequiringManualDecision } = sortGroupStandings([t2, t1], [match])
            
            // Should sort T1 above T2
            expect(standings[0].team_id).toBe('T1')
            expect(standings[1].team_id).toBe('T2')

            // No manual decision needed since H2H resolved it
            expect(hasTieRequiringManualDecision).toBe(false)
            expect(standings[0].needsManualDecision).toBe(false)
            expect(standings[1].needsManualDecision).toBe(false)
        })
    })
})
