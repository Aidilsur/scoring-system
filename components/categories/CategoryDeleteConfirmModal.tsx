'use client'

import React from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface CategoryDeleteConfirmModalProps {
    isOpen: boolean
    categoryName?: string
    isDeleting?: boolean
    onClose: () => void
    onConfirm: () => void
}

export function CategoryDeleteConfirmModal({
    isOpen,
    categoryName,
    isDeleting = false,
    onClose,
    onConfirm,
}: CategoryDeleteConfirmModalProps) {
    if (!isOpen) return null

    return (
        <div
            role="dialog"
            aria-modal="true"
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center p-4',
                'bg-black/85 backdrop-blur-md animate-in fade-in duration-200'
            )}
        >
            <div
                className={cn(
                    'relative w-full max-w-md bg-zinc-900 border border-zinc-800',
                    'rounded-2xl shadow-2xl shadow-black/80 p-6 overflow-hidden'
                )}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    aria-label="Tutup dialog konfirmasi"
                    className={cn(
                        'absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400',
                        'hover:text-white hover:bg-zinc-800 transition cursor-pointer',
                        'disabled:opacity-50'
                    )}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Modal Header */}
                <div className="flex items-start gap-3.5 mb-4">
                    <div
                        className={cn(
                            'p-2.5 rounded-xl bg-rose-500/15 border',
                            'border-rose-500/30 text-rose-400 shrink-0'
                        )}
                    >
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                            Hapus Kategori?
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Kategori:{' '}
                            <span className="font-semibold text-rose-400">
                                {categoryName || 'Terpilih'}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Modal Warning Body */}
                <div
                    className={cn(
                        'space-y-3 text-xs text-zinc-300 mb-6 bg-zinc-950/60',
                        'p-4 rounded-xl border border-zinc-800/80'
                    )}
                >
                    <p className="leading-relaxed">
                        Apakah Anda yakin ingin menghapus kategori turnamen ini secara permanen?
                    </p>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Tindakan ini bersifat destruktif. Kategori hanya dapat dihapus jika
                        tidak ada tim yang terdaftar di dalamnya.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={isDeleting}
                        onClick={onClose}
                    >
                        Batal
                    </Button>
                    <button
                        type="button"
                        disabled={isDeleting}
                        onClick={onConfirm}
                        className={cn(
                            'inline-flex items-center justify-center px-4 py-2',
                            'rounded-xl text-xs font-semibold bg-rose-600',
                            'hover:bg-rose-500 active:bg-rose-700 text-white transition',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'cursor-pointer shadow-lg shadow-rose-950/40'
                        )}
                    >
                        {isDeleting && (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        )}
                        {isDeleting ? 'Menghapus...' : 'Ya, Hapus Kategori'}
                    </button>
                </div>
            </div>
        </div>
    )
}
