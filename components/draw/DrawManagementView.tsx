'use client'

import React from 'react'
import Link from 'next/link'
import {
  RotateCw,
  Info,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
} from 'lucide-react'
import { useDrawManagement } from '@/hooks/useDrawManagement'
import { SelectInput, Card } from '@/components/ui'
import { DrawPreviewCard } from './DrawPreviewCard'
import { DrawGroupsView } from './DrawGroupsView'
import { DrawRegenerateConfirmModal } from './DrawRegenerateConfirmModal'

/**
 * Petunjuk aturan drawing turnamen (Data-driven constant di module-level sesuai §G)
 */
const DRAW_RULE_HINTS = [
  {
    label: 'Kategori Terpisah',
    description:
      'Drawing dilakukan secara mandiri per kategori. Sistem tidak mencampur kategori berbeda.',
  },
  {
    label: 'Hanya Tim Confirmed',
    description:
      'Hanya tim yang telah diverifikasi pembayarannya (status confirmed) yang masuk ke dalam undian.',
  },
  {
    label: 'Pengacakan Fisher-Yates',
    description:
      'Tim diacak secara acak dan seragam (unbiased), lalu didistribusikan seserata mungkin.',
  },
  {
    label: 'Jadwal Otomatis',
    description:
      'Pertandingan round robin langsung digenerate tanpa duplikat (n × (n - 1) / 2 match per grup).',
  },
  {
    label: 'Kunci Regenerate',
    description:
      'Regenerate draw otomatis dikunci begitu ada pertandingan yang berstatus live atau selesai.',
  },
] as const

export interface DrawManagementViewProps {
  initialCategoryId?: string
}

export function DrawManagementView({
  initialCategoryId,
}: DrawManagementViewProps) {
  const {
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    drawData,
    isLoadingCategories,
    isLoadingDraw,
    isRefetchingDraw,
    refetchDraw,
    isCategoriesError,
    categoriesError,
    isGenerating,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    toast,
    clearToast,
    handleTriggerDraw,
    handleConfirmRegenerate,
  } = useDrawManagement(initialCategoryId)

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: `${cat.name} (${cat.partner_type.toUpperCase()} - ${cat.level.toUpperCase()})`,
  }))

  return (
    <div className="space-y-8">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">
              Drawing Grup
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Drawing Grup &amp; Jadwal
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Acak peserta terkonfirmasi ke dalam grup dan buat jadwal pertandingan round robin otomatis.
          </p>
        </div>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={() => refetchDraw()}
          disabled={isLoadingDraw || isRefetchingDraw}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${
              isRefetchingDraw ? 'animate-spin text-emerald-500' : ''
            }`}
          />
          Segarkan Data
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-start justify-between gap-3 p-4 rounded-2xl border text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={clearToast}
            aria-label="Tutup notifikasi"
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid: Main Selection & Sidebar Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Selector Card */}
          <Card variant="elevated" className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <Layers className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Pilih Kategori Turnamen
              </h2>
            </div>

            {isCategoriesError ? (
              <p className="text-xs text-rose-500">
                Gagal memuat kategori:{' '}
                {categoriesError instanceof Error
                  ? categoriesError.message
                  : 'Kesalahan sistem'}
              </p>
            ) : (
              <SelectInput
                label="Kategori Pertandingan Aktif"
                id="category-selector"
                value={selectedCategoryId}
                disabled={isLoadingCategories || isGenerating}
                options={categoryOptions}
                placeholder="-- Pilih Kategori --"
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                helperText="Pilih kategori turnamen yang ingin di-generate drawing grupnya."
              />
            )}
          </Card>

          {/* Preview & Action Card */}
          {selectedCategoryId && (
            <DrawPreviewCard
              categoryName={selectedCategory?.name}
              confirmedCount={drawData?.confirmedTeams.length ?? 0}
              targetGroupSize={drawData?.teamPerGroup ?? 4}
              previewGroupSizes={drawData?.previewGroupSizes ?? []}
              hasExistingDraw={drawData?.hasExistingDraw ?? false}
              hasStartedMatches={drawData?.hasStartedMatches ?? false}
              isGenerating={isGenerating}
              onTriggerDraw={handleTriggerDraw}
            />
          )}

          {/* Groups & Matches Result View */}
          {selectedCategoryId && (
            <DrawGroupsView
              groups={drawData?.groups ?? []}
              matches={drawData?.matches ?? []}
            />
          )}
        </div>

        {/* Sidebar: Rules & Guidelines */}
        <div className="space-y-6">
          <Card variant="elevated" className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <Info className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Petunjuk Drawing &amp; Jadwal
              </h3>
            </div>

            <ul className="space-y-3">
              {DRAW_RULE_HINTS.map((item) => (
                <li
                  key={item.label}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800"
                >
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DrawRegenerateConfirmModal
        isOpen={isConfirmModalOpen}
        categoryName={selectedCategory?.name}
        isGenerating={isGenerating}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmRegenerate}
      />
    </div>
  )
}
