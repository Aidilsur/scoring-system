'use client'

import React from 'react'
import Link from 'next/link'
import { RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useTeamsManagement } from '@/hooks/useTeamsManagement'
import { TeamFilters } from './TeamFilters'
import { TeamCard } from './TeamCard'
import { TeamDetailModal } from './TeamDetailModal'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * TeamsManagementView
 * Container component menghubungkan hook useTeamsManagement ke presentational components
 */
export function TeamsManagementView() {
    const {
        teams,
        categories,
        isLoading,
        isError,
        error,
        refetch,
        statusFilter,
        setStatusFilter,
        categoryFilter,
        setCategoryFilter,
        selectedTeam,
        isDetailOpen,
        signedPaymentUrl,
        isLoadingSignedUrl,
        openDetail,
        closeDetail,
        updateStatus,
        isUpdating,
        toast,
        clearToast,
    } = useTeamsManagement()

    return (
        <div className="space-y-6">
            {/* Top Navigation & Header */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800"
            >
                <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                        <Link href="/admin" className="hover:text-lime-400 transition-colors">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-200 font-medium">
                            Verifikasi Peserta
                        </span>
                    </div>
                    <h1
                        className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight"
                    >
                        Kelola &amp; Verifikasi Peserta
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        Tinjau bukti pembayaran pendaftaran tim sebelum
                        diikutsertakan ke drawing turnamen.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={`w-3.5 h-3.5 mr-1.5 ${
                                isLoading ? 'animate-spin text-lime-400' : ''
                            }`}
                        />
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div
                    className={cn(
                        'p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-3 border',
                        {
                            'bg-lime-400/10 text-lime-300 border-lime-400/30': toast.type === 'success',
                            'bg-rose-500/10 text-rose-300 border-rose-500/30': toast.type !== 'success',
                        }
                    )}
                >
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{toast.message}</span>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearToast}
                        className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
                        aria-label="Tutup notifikasi"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Filter Bar */}
            <TeamFilters
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                categories={categories}
                totalCount={teams.length}
            />

            {/* Content List */}
            {isLoading ? (
                <div className="py-16 text-center space-y-3">
                    <div
                        className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto"
                    />
                    <p className="text-xs text-zinc-400">Memuat data pendaftar dari database...</p>
                </div>
            ) : isError ? (
                <div
                    className="p-6 bg-rose-950/30 border border-rose-900/60 rounded-2xl text-center space-y-2"
                >
                    <p className="text-sm font-semibold text-rose-300">
                        Gagal memuat data tim
                    </p>
                    <p className="text-xs text-zinc-400">
                        {error instanceof Error
                            ? error.message
                            : 'Terjadi kesalahan tidak dikenal.'}
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                        Coba Lagi
                    </Button>
                </div>
            ) : teams.length === 0 ? (
                <div
                    className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl space-y-2"
                >
                    <p className="text-sm font-bold text-white uppercase tracking-wide">
                        Tidak ada tim yang cocok dengan filter saat ini
                    </p>
                    <p className="text-xs text-zinc-400">
                        Ubah filter status atau kategori untuk melihat tim lain.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teams.map((team) => (
                        <TeamCard
                            key={team.id}
                            team={team}
                            onOpenDetail={openDetail}
                            onConfirm={(id) => updateStatus(id, 'confirmed')}
                            onReject={(id) => updateStatus(id, 'rejected')}
                            isUpdating={isUpdating}
                        />
                    ))}
                </div>
            )}

            {/* Detail & Payment Proof Modal */}
            <TeamDetailModal
                isOpen={isDetailOpen}
                team={selectedTeam}
                signedPaymentUrl={signedPaymentUrl}
                isLoadingSignedUrl={isLoadingSignedUrl}
                onClose={closeDetail}
                onConfirm={(id) => updateStatus(id, 'confirmed')}
                onReject={(id) => updateStatus(id, 'rejected')}
                isUpdating={isUpdating}
            />
        </div>
    )
}
