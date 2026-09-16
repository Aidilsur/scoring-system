import type { LucideIcon } from 'lucide-react'
import { Clock, CheckCircle2, Zap, AlertCircle } from 'lucide-react'
import type { MatchRound, MatchStatus } from '@/types/domain'

/**
 * Konstanta durasi concurrency lock untuk wasit scoring.
 * 2 menit TTL (Time-To-Live).
 */
export const SESSION_LOCK_TTL_MS = 2 * 60 * 1000 // 2 menit

/**
 * Interval pengiriman heartbeat wasit aktif saat tab browser visible (30 detik).
 */
export const HEARTBEAT_INTERVAL_MS = 30 * 1000 // 30 detik

/**
 * Label nama ronde pertandingan (Penyisihan Grup, Semifinal, Final, Perebutan Juara 3)
 */
export const ROUND_LABELS: Record<MatchRound, string> = {
    group: 'Penyisihan Grup',
    semifinal: 'Semifinal',
    final: 'Final',
    third_place: 'Perebutan Juara 3',
}

export interface MatchStatusConfig {
    label: string
    badgeClass: string
    icon: LucideIcon
}

/**
 * Konfigurasi badge & icon status pertandingan
 */
export const MATCH_STATUS_CONFIG: Record<MatchStatus, MatchStatusConfig> = {
    live: {
        label: 'LIVE',
        badgeClass: 'bg-lime-400/20 text-lime-400 border border-lime-400/60 shadow-sm shadow-lime-400/20 font-black',
        icon: Zap,
    },
    scheduled: {
        label: 'SCHEDULED',
        badgeClass: 'bg-zinc-800/90 text-zinc-300 border border-zinc-700/80 font-bold',
        icon: Clock,
    },
    completed: {
        label: 'COMPLETED',
        badgeClass: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold',
        icon: CheckCircle2,
    },
    walkover: {
        label: 'WALKOVER',
        badgeClass: 'bg-rose-950/80 text-rose-300 border border-rose-800/80 font-bold',
        icon: AlertCircle,
    },
}
