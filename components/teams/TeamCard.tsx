import React from 'react'
import { Team } from '@/types/domain'
import { TeamStatusBadge } from './TeamStatusBadge'
import { formatCategoryBadge, formatPhoneNumber } from '@/utils/format'
import { Button } from '@/components/ui'

interface TeamCardProps {
    team: Team
    onOpenDetail: (team: Team) => void
    onConfirm: (teamId: string) => void
    onReject: (teamId: string) => void
    isUpdating?: boolean
}

/**
 * TeamCard (Presentational-only)
 * Kartu data tim peserta untuk list admin
 */
export function TeamCard({
    team,
    onOpenDetail,
    onConfirm,
    onReject,
    isUpdating = false,
}: TeamCardProps) {
    const formattedDate = new Date(team.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    const categoryText = team.categories
        ? `${team.categories.name} (${formatCategoryBadge(
              team.categories.partner_type,
              team.categories.level
          )})`
        : 'Kategori Umum'

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
            {/* Header: Kategori & Status */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {categoryText}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                        {team.player1_name} &amp; {team.player2_name}
                    </h3>
                </div>
                <TeamStatusBadge status={team.status} />
            </div>

            {/* Info baris: WhatsApp & Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-500">WhatsApp:</span>
                    <a
                        href={`https://wa.me/${team.phone_number.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        {formatPhoneNumber(team.phone_number)}
                    </a>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-500">Daftar:</span>
                    <span>{formattedDate}</span>
                </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenDetail(team)}
                    className="text-xs"
                >
                    Lihat Detail &amp; Bukti
                </Button>

                <div className="flex items-center gap-2">
                    {team.status !== 'confirmed' && (
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => onConfirm(team.id)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500"
                        >
                            Konfirmasi
                        </Button>
                    )}

                    {team.status !== 'rejected' && (
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => onReject(team.id)}
                            className="text-xs"
                        >
                            Tolak
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
