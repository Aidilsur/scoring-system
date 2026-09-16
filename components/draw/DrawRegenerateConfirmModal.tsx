'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui'
export interface DrawRegenerateConfirmModalProps {
  isOpen: boolean
  categoryName?: string
  isGenerating?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DrawRegenerateConfirmModal({
  isOpen,
  categoryName,
  isGenerating,
  onClose,
  onConfirm,
}: DrawRegenerateConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 p-6 overflow-hidden"
      >
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
          <div
            className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0"
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
              Regenerate Drawing Grup?
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Kategori:{' '}
              <span className="font-semibold text-lime-400">
                {categoryName || 'Terpilih'}
              </span>
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div
          className="space-y-2.5 text-xs text-zinc-300 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800 mb-6"
        >
          <p>
            Tindakan ini akan{' '}
            <span className="font-bold text-rose-400">mereset dan menghapus</span>{' '}
            seluruh struktur grup serta jadwal pertandingan round robin yang
            sebelumnya telah dibuat untuk kategori ini.
          </p>
          <p>
            Seluruh tim terkonfirmasi akan diacak kembali ke dalam grup baru.
            Pertandingan yang belum dijadwalkan ulang akan dibuat kembali secara
            otomatis.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isGenerating}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isGenerating}
            loadingText="Mengacak Ulang..."
          >
            Ya, Regenerate Draw
          </Button>
        </div>
      </div>
    </div>
  )
}
