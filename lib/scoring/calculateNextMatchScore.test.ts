import { describe, it, expect } from 'vitest'
import { calculateNextMatchScore } from './calculateNextMatchScore'
import type { Match } from '@/types/domain'

function createMockMatch(overrides?: Partial<Match>): Match {
    return {
        id: 'match-1',
        category_id: 'cat-1',
        round: 'group',
        team_a_id: 'team-a',
        team_b_id: 'team-b',
        status: 'scheduled',
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

describe('calculateNextMatchScore', () => {
    describe('Kelompok 1 - Guard: Match sudah completed', () => {
        it("1. Match dengan status: 'completed' → return object yang PERSIS SAMA", () => {
            const match = createMockMatch({ status: 'completed' })
            const result = calculateNextMatchScore(match, 'team_a')
            expect(result).toEqual(match)
        })
    })

    describe('Kelompok 2 - Progresi normal (round: group, belum masuk tiebreak)', () => {
        it("2. status='scheduled', team_a menang poin → expect current_point_a='15', status BERUBAH jadi 'live'", () => {
            const match = createMockMatch()
            const result = calculateNextMatchScore(match, 'team_a')
            expect(result.current_point_a).toBe('15')
            expect(result.status).toBe('live')
            expect(result.games_team_a).toBe(0)
            expect(result.games_team_b).toBe(0)
        })
        
        it("3. current_point_a='40', team_a menang poin → expect games_team_a jadi 1, points reset ke '0'", () => {
            const match = createMockMatch({ current_point_a: '40', current_point_b: '0' })
            const result = calculateNextMatchScore(match, 'team_a')
            expect(result.games_team_a).toBe(1)
            expect(result.current_point_a).toBe('0')
            expect(result.current_point_b).toBe('0')
        })
    })

    describe('Kelompok 3 - Transisi otomatis ke tiebreak (round: group, 2-2)', () => {
        it("4. games_team_a=2, games_team_b=2, team_a menang poin → MASUK MODE TIEBREAK (current_point_a='1')", () => {
            const match = createMockMatch({ games_team_a: 2, games_team_b: 2 })
            const result = calculateNextMatchScore(match, 'team_a')
            expect(result.current_point_a).toBe('1')
        })
    })

    describe('Kelompok 4 - Match selesai di fase grup (Best of 5)', () => {
        it("5. games_team_a=2, games_team_b=1, current_point_a='40', team_a menang poin → status='completed', winner_team_id terisi, completed_at terisi", () => {
            const match = createMockMatch({ games_team_a: 2, games_team_b: 1, current_point_a: '40', status: 'live' })
            const result = calculateNextMatchScore(match, 'team_a')
            expect(result.games_team_a).toBe(3)
            expect(result.status).toBe('completed')
            expect(result.winner_team_id).toBe(match.team_a_id)
            expect(result.completed_at).not.toBeNull()
        })
    })

    describe('Kelompok 5 - Golden game knockout (round: semifinal, 5-5)', () => {
        it("6. round='semifinal', games_team_a=5, games_team_b=5, team_a menang poin → masuk mode tiebreak (current_point_a='1')", () => {
            const match = createMockMatch({ round: 'semifinal', games_team_a: 5, games_team_b: 5 })
            const result = calculateNextMatchScore(match, 'team_a')
            expect(result.current_point_a).toBe('1')
        })

        it("7. Lanjutan test 6 (current_point_a='6', current_point_b='6'), team_a menang poin → games_team_a=6, status='completed' (tanpa syarat selisih 2)", () => {
            const match = createMockMatch({
                round: 'semifinal',
                games_team_a: 5,
                games_team_b: 5,
                current_point_a: '6', // String representation required by Match type
                current_point_b: '6',
                status: 'live'
            })
            const result = calculateNextMatchScore(match, 'team_a')
            expect(result.games_team_a).toBe(6)
            expect(result.status).toBe('completed')
            expect(result.winner_team_id).toBe(match.team_a_id)
        })
    })

    describe('Kelompok 6 - Match selesai di knockout (First to 6)', () => {
        it("8. round='final', games_team_a=5, games_team_b=3, current_point_a='40', team_a menang poin → status='completed', winner_team_id terisi", () => {
            const match = createMockMatch({
                round: 'final',
                games_team_a: 5,
                games_team_b: 3,
                current_point_a: '40',
                status: 'live'
            })
            const result = calculateNextMatchScore(match, 'team_a')
            expect(result.games_team_a).toBe(6)
            expect(result.status).toBe('completed')
            expect(result.winner_team_id).toBe(match.team_a_id)
        })
    })

    describe('Kelompok 7 - goldenPointEnabled parameter diteruskan dengan benar', () => {
        it("9. current_point_a='40', current_point_b='40', goldenPointEnabled=false, team_a menang poin → expect current_point_a jadi 'AD'", () => {
            const match = createMockMatch({ current_point_a: '40', current_point_b: '40', status: 'live' })
            const result = calculateNextMatchScore(match, 'team_a', false)
            expect(result.current_point_a).toBe('AD')
            expect(result.status).toBe('live')
        })
    })
})
