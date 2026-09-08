'use client'

import React from 'react'
import {
  Users,
  Layers,
  CalendarCheck,
  RotateCw,
  Sparkles,
  Lock,
  AlertCircle,
} from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'

export interface DrawPreviewCardProps {
  categoryName?: string
  confirmedCount: number
  targetGroupSize: number
  previewGroupSizes: number[]
  hasExistingDraw: boolean
  hasStartedMatches: boolean
  isGenerating: boolean
  onTriggerDraw: () => void
}

export function DrawPreviewCard({
  categoryName,
  confirmedCount,
  targetGroupSize,
  previewGroupSizes,
  hasExistingDraw,
  hasStartedMatches,
  isGenerating,
  onTriggerDraw,
}: DrawPreviewCardProps) {
  // Hitung perkiraan total match round robin: sum(n * (n - 1) / 2)
  const estimatedMatchesCount = previewGroupSizes.reduce(
    (sum, size) => sum + (size * (size - 1)) / 2,
    0
  )

  const isNotEnoughTeams = confirmedCount < 2
  const isButtonDisabled = isGenerating || isNotEnoughTeams || hasStartedMatches

  return (
    <Card variant="elevated" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Status &amp; Simulasi Drawing
            </h2>
            {hasExistingDraw ? (
              <Badge variant="success">Sudah Di-Draw</Badge>
            ) : (
              <Badge variant="neutral">Belum Di-Draw</Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Kategori:{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {categoryName || 'Belum Dipilih'}
            </span>
          </p>
        </div>

        {/* Action Button */}
        <div>
          <Button
            type="button"
            variant={hasExistingDraw ? 'outline' : 'primary'}
            size="md"
            disabled={isButtonDisabled}
            isLoading={isGenerating}
            loadingText={hasExistingDraw ? 'Mengacak Ulang...' : 'Membuat Draw...'}
            onClick={onTriggerDraw}
            className="w-full sm:w-auto"
          >
            {hasExistingDraw ? (
              <>
                <RotateCw className="w-4 h-4 mr-2" />
                Regenerate Draw
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Draw
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Warning/Alert Messages */}
      {hasStartedMatches && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Drawing Terkunci</p>
            <p className="mt-0.5 text-rose-500/90 dark:text-rose-400/90">
              Terdapat pertandingan yang berstatus <span className="font-bold">Live</span> atau <span className="font-bold">Completed</span> pada kategori ini. Sesuai aturan turnamen, drawing grup tidak dapat di-regenerate setelah pertandingan dimulai.
            </p>
          </div>
        </div>
      )}

      {isNotEnoughTeams && !hasStartedMatches && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Jumlah Tim Belum Mencukupi</p>
            <p className="mt-0.5 text-amber-600/90 dark:text-amber-400/90">
              Kategori ini baru memiliki {confirmedCount} tim berstatus confirmed. Minimal dibutuhkan 2 tim terkonfirmasi untuk membuat drawing grup.
            </p>
          </div>
        </div>
      )}

      {/* Grid Informasi Simulasi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Confirmed Teams */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Tim Confirmed
            </p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-white">
              {confirmedCount}{' '}
              <span className="text-xs font-normal text-zinc-400">Tim</span>
            </p>
          </div>
        </div>

        {/* Groups Distribution */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Format Grup ({targetGroupSize}/grup)
            </p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-white">
              {previewGroupSizes.length}{' '}
              <span className="text-xs font-normal text-zinc-400">
                Grup {previewGroupSizes.length > 0 && `(${previewGroupSizes.join(', ')})`}
              </span>
            </p>
          </div>
        </div>

        {/* Round Robin Matches */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Total Match Round Robin
            </p>
            <p className="text-xl font-extrabold text-zinc-900 dark:text-white">
              {estimatedMatchesCount}{' '}
              <span className="text-xs font-normal text-zinc-400">Match</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
