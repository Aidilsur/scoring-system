import React from 'react'
import { X, ExternalLink } from 'lucide-react'
import { Team } from '@/types/domain'
import { TeamStatusBadge } from './TeamStatusBadge'
import { formatCategoryBadge, formatPhoneNumber } from '@/utils/format'
import { Button } from '@/components/ui'

interface TeamDetailModalProps {
    isOpen: boolean
    team: Team | null
    signedPaymentUrl: string | null
    isLoadingSignedUrl: boolean
    onClose: () => void
    onConfirm: (teamId: string) => void
    onReject: (teamId: string) => void
    isUpdating?: boolean
}

/**
 * TeamDetailModal (Presentational-only)
 * Modal popup untuk melihat detail pendaftaran dan preview bukti transfer
 */
export function TeamDetailModal({
    isOpen,
    team,
    signedPaymentUrl,
    isLoadingSignedUrl,
    onClose,
    onConfirm,
    onReject,
    isUpdating = false,
}: TeamDetailModalProps) {
    if (!isOpen || !team) return null

    const formattedDate = new Date(team.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })

    const isPdf = team.payment_proof_url.toLowerCase().endsWith('.pdf')

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl shadow-black/80 my-8 text-white">
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
                    <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                            Detail Pendaftaran Tim
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">
                            ID: {team.id}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                        aria-label="Tutup modal"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Status & Kategori */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Kategori Kelas</span>
                        <span className="text-sm font-bold text-lime-400">
                            {team.categories
                                ? `${team.categories.name} (${formatCategoryBadge(
                                      team.categories.partner_type,
                                      team.categories.level
                                  )})`
                                : '-'}
                        </span>
                    </div>
                    <TeamStatusBadge status={team.status} />
                </div>

                {/* Informasi Pemain & Kontak */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Pemain 1</span>
                        <p className="font-bold text-white">
                            {team.player1_name}
                        </p>
                    </div>

                    <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Pemain 2 (Partner)</span>
                        <p className="font-bold text-white">
                            {team.player2_name}
                        </p>
                    </div>

                    <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">WhatsApp / Telepon</span>
                        <p className="font-semibold text-lime-400 font-mono">
                            <a
                                href={`https://wa.me/${team.phone_number.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline"
                            >
                                {formatPhoneNumber(team.phone_number)}
                            </a>
                        </p>
                    </div>

                    <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-1">
                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Media Sosial</span>
                        <p className="text-zinc-300 font-mono text-xs">
                            IG: <span className="font-semibold text-white">{team.instagram_handle || '-'}</span>
                            <br />
                            Reclub: <span className="font-semibold text-white">{team.reclub_handle || '-'}</span>
                        </p>
                    </div>
                </div>

                {/* Tanggal Daftar */}
                <p className="text-xs text-zinc-400 font-mono">
                    Waktu Pendaftaran: <span className="text-zinc-200">{formattedDate}</span>
                </p>

                {/* Preview Bukti Pembayaran */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Bukti Pembayaran (Private Storage)
                    </h4>

                    {isLoadingSignedUrl ? (
                        <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                            <span>Membuat secure signed URL...</span>
                        </div>
                    ) : signedPaymentUrl ? (
                        <div className="space-y-3">
                            {!isPdf ? (
                                <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden max-h-72 flex items-center justify-center bg-zinc-950">
                                    <img
                                        src={signedPaymentUrl}
                                        alt="Bukti Transfer"
                                        className="max-h-72 object-contain w-auto"
                                    />
                                </div>
                            ) : (
                                <div className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/40">
                                    <div className="w-10 h-10 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                                        PDF
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                                            {team.payment_proof_url.split('/').pop()}
                                        </p>
                                        <p className="text-[11px] text-zinc-500">Dokumen PDF Terlampir</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-end">
                                <a
                                    href={signedPaymentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                                >
                                    <span>Buka Dokumen di Tab Baru</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-rose-500 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                            Bukti pembayaran tidak dapat dimuat atau path berkas tidak ditemukan.
                        </p>
                    )}
                </div>

                {/* Modal Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                    >
                        Tutup
                    </Button>

                    <div className="flex items-center gap-2">
                        {team.status !== 'confirmed' && (
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => onConfirm(team.id)}
                            >
                                Konfirmasi Tim
                            </Button>
                        )}

                        {team.status !== 'rejected' && (
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => onReject(team.id)}
                            >
                                Tolak Tim
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
