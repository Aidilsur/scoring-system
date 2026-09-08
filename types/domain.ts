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

export interface Category {
    id: string
    name: string
    partner_type: PartnerType | string
    level: CategoryLevel | string
    is_active?: boolean
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
    status: TournamentStatus
    created_at?: string
    updated_at?: string
}

