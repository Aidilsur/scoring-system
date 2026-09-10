import type { MatchRound } from '@/types/domain'

export type MatchTeam = 'team_a' | 'team_b'

export type RegularPoint = '0' | '15' | '30' | '40' | 'AD'

export interface RegularGameState {
    pointA: RegularPoint
    pointB: RegularPoint
    goldenPointEnabled: boolean
}

export interface RegularGameResult {
    pointA: RegularPoint
    pointB: RegularPoint
    isGameWon: boolean
    winner: MatchTeam | null
}

export interface TiebreakState {
    pointA: number
    pointB: number
}

export interface TiebreakResult {
    pointA: number
    pointB: number
    isGameWon: boolean
    winner: MatchTeam | null
}

export type { MatchRound }
