import React from 'react'
import { TeamStatus } from '@/types/domain'
import { Badge } from '@/components/ui'

interface TeamStatusBadgeProps {
    status: TeamStatus
    className?: string
}

/**
 * TeamStatusBadge (Presentational-only)
 * Menampilkan badge status tim (Pending, Confirmed, Rejected)
 * Menggunakan komponen atomic Badge dari components/ui
 */
export function TeamStatusBadge({ status, className = '' }: TeamStatusBadgeProps) {
    const config: Record<
        TeamStatus,
        { label: string; variant: 'warning' | 'success' | 'danger'; dotClass: string }
    > = {
        pending: {
            label: 'Pending',
            variant: 'warning',
            dotClass: 'bg-amber-500',
        },
        confirmed: {
            label: 'Confirmed',
            variant: 'success',
            dotClass: 'bg-emerald-500',
        },
        rejected: {
            label: 'Rejected',
            variant: 'danger',
            dotClass: 'bg-rose-500',
        },
    }

    const { label, variant, dotClass } = config[status] || config.pending

    return (
        <Badge variant={variant} size="sm" className={`normal-case tracking-normal ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            <span>{label}</span>
        </Badge>
    )
}
