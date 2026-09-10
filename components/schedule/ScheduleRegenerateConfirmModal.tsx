'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui'

export interface ScheduleRegenerateConfirmModalProps {
    isOpen: boolean
    categoryName?: string
    mode?: 'single' | 'all'
    isGenerating?: boolean
    onClose: () => void
    onConfirm: () => void
}

export function ScheduleRegenerateConfirmModal({
    isOpen,
    categoryName,
    mode = 'single',
    isGenerating,
    onClose,
    onConfirm,
}: ScheduleRegenerateConfirmModalProps) {
    if (!isOpen) return null

    const isAllMode = mode === 'all'

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        >
            <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 p-6 overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={isGenerating}
                    aria-label="Tutup dialog"
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Modal Header */}
                <div className="flex items-start gap-3.5 mb-4">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                            {isAllMode
                                ? 'Regenerate Jadwal SEMUA Kategori?'
                                : 'Regenerate Jadwal Pertandingan?'}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Cakupan:{' '}
                            <span className="font-semibold text-lime-400">
                                {isAllMode ? 'Seluruh Kategori Aktif (Paralel)' : (categoryName || 'Terpilih')}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="space-y-2.5 text-xs text-zinc-300 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 mb-6">
                    {isAllMode ? (
                        <>
                            <p>
                                Seluruh slot jadwal babak grup untuk <strong>semua kategori aktif</strong> akan direset dan disusun ulang bersamaan dari awal.
                            </p>
                            <p className="text-zinc-400">
                                • Pertandingan dari kategori berbeda dapat mengisi lapangan berbeda pada ronde/waktu yang sama (paralel).
                                <br />
                                • Aturan jeda minimal 1 ronde per tim tetap dijamin penuh.
                                <br />
                                • Pertandingan yang sudah <code>live</code> atau <code>completed</code> tidak akan terganggu.
                            </p>
                        </>
                    ) : (
                        <>
                            <p>
                                Jadwal pertandingan yang sudah ada untuk kategori ini akan direset dan disusun ulang secara otomatis.
                            </p>
                            <p className="text-zinc-400">
                                • Slot yang terpakai oleh kategori lain akan tetap dihindari.
                                <br />
                                • Aturan jeda minimal 1 ronde per tim akan tetap dihitung ulang.
                                <br />
                                • Tindakan ini <strong>tidak mempengaruhi</strong> kategori turnamen lainnya.
                            </p>
                        </>
                    )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isGenerating}
                        onClick={onClose}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={isGenerating}
                        onClick={onConfirm}
                        className="!bg-lime-400 hover:!bg-lime-300 !text-zinc-950 !font-black uppercase tracking-wider rounded-xl shadow-lg shadow-lime-400/20"
                    >
                        Ya, Susun Ulang Jadwal
                    </Button>
                </div>
            </div>
        </div>
    )
}
