/**
 * Domain types untuk Padel Tournament Scoring System
 * Sesuai dengan spesifikasi §4 & §5
 */

export type TeamStatus = 'pending' | 'confirmed' | 'rejected'
export type PartnerType = 'fix' | 'mix'
export type CategoryLevel = 'beginner' | 'lower_bronze' | 'bronze'
export type TournamentStatus = 'draft' | 'draw_done' | 'ongoing' | 'completed'
export type MatchRound = 'group' | 'semifinal' | 'final' | 'third_place'
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'walkover'
export type AdminRole = 'admin' | 'referee'

export interface AdminUser {
    id: string
    email: string
    role: AdminRole
    created_at: string
}

export interface Category {
    id: string
    name: string
    partner_type: PartnerType | string
    level: CategoryLevel | string
    is_active?: boolean
    created_at?: string
}

export interface CategoryWithTeamCount extends Category {
    team_count: number
}

export interface Team {
    id: string
    category_id: string
    player1_name: string
    player2_name: string
    phone_number: string
    instagram_handle?: string | null
    reclub_handle?: string | null
    payment_proof_url: string
    status: TeamStatus
    created_at: string
    categories?: Category | null
}

export interface TournamentSettings {
    id: string
    name: string
    team_per_group: number
    golden_point_enabled: boolean
    third_place_enabled: boolean
    number_of_courts: number
    match_duration_minutes: number
    daily_start_time: string
    daily_end_time: string
    status: TournamentStatus
    event_date?: string | null
    venue_name?: string | null
    venue_address?: string | null
    created_at?: string
    updated_at?: string
}

export interface Group {
    id?: string
    category_id?: string
    name: string
    teams?: Team[]
    created_at?: string
}

export interface GroupTeam {
    id?: string
    group_id: string
    team_id: string
    teams?: Team
}

export interface Court {
    id: string
    tournament_id: string
    name: string
    created_at?: string
}

export interface Match {
    id: string
    category_id: string
    group_id?: string | null
    round: MatchRound
    team_a_id: string
    team_b_id: string
    court_id?: string | null
    status: MatchStatus
    winner_team_id?: string | null
    games_team_a: number
    games_team_b: number
    current_point_a?: string | null
    current_point_b?: string | null
    scheduled_time?: string | null
    completed_at?: string | null
    active_scorer_session_id?: string | null
    active_scorer_claimed_at?: string | null
    team_a?: Team | null
    team_b?: Team | null
    group?: Group | null
    court?: Court | null
    category?: Category | null
}

export interface MatchScoreHistory {
    id: string
    match_id: string
    point_a: string
    point_b: string
    games_team_a: number
    games_team_b: number
    status: MatchStatus
    winner_team_id?: string | null
    created_at: string
}

export interface StandingRow {
    group_id: string
    team_id: string
    played: number
    won: number
    drawn: number
    lost: number
    games_for: number
    games_against: number
    game_diff: number
    points: number
    team?: Team | null
    group?: Group | null
}

export interface GroupStandingItem extends StandingRow {
    rank: number
    isQualified: boolean
    isWinner: boolean
    isRunnerUp: boolean
    needsManualDecision?: boolean
}

export interface GroupWithStandings {
    group: Group
    standings: GroupStandingItem[]
    hasTieRequiringManualDecision: boolean
}
