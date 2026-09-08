'use client'

import React from 'react'
import Link from 'next/link'
import { useTeamsManagement } from '@/hooks/useTeamsManagement'
import { TeamFilters } from './TeamFilters'
import { TeamCard } from './TeamCard'
import { TeamDetailModal } from './TeamDetailModal'
import { Button } from '@/components/ui'

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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <Link href="/admin" className="hover:underline">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                            Verifikasi Peserta
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                        Kelola &amp; Verifikasi Peserta
                    </h1>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Tinjau bukti pembayaran pendaftaran tim sebelum diikutsertakan ke drawing turnamen.
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
                        <svg
                            className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Refresh Data
                    </Button>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div
                    className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-3 border ${
                        toast.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' ? (
                            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span>{toast.message}</span>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearToast}
                        className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded-lg"
                        aria-label="Tutup notifikasi"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-zinc-500">Memuat data pendaftar dari database...</p>
                </div>
            ) : isError ? (
                <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-center space-y-2">
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                        Gagal memuat data tim
                    </p>
                    <p className="text-xs text-zinc-500">
                        {error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal.'}
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                        Coba Lagi
                    </Button>
                </div>
            ) : teams.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl space-y-2">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Tidak ada tim yang cocok dengan filter saat ini
                    </p>
                    <p className="text-xs text-zinc-500">
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
