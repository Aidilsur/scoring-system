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
import { cn } from '@/lib/utils'

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
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between',
          'gap-3 pb-4 border-b border-zinc-800'
        )}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">
              Status &amp; Simulasi Drawing
            </h2>
            {hasExistingDraw ? (
              <Badge variant="success">Sudah Di-Draw</Badge>
            ) : (
              <Badge variant="neutral">Belum Di-Draw</Badge>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kategori:{' '}
            <span className="font-semibold text-lime-400">
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
        <div
          className={cn(
            'flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10',
            'border border-rose-500/30 text-rose-300 text-xs'
          )}
        >
          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
          <div>
            <p className="font-bold uppercase tracking-wider text-rose-400">
              Drawing Terkunci
            </p>
            <p className="mt-0.5 text-rose-300/90 leading-relaxed">
              Terdapat pertandingan yang berstatus{' '}
              <span className="font-bold text-rose-200">Live</span> atau{' '}
              <span className="font-bold text-rose-200">Completed</span> pada
              kategori ini. Sesuai aturan turnamen, drawing grup tidak dapat
              di-regenerate setelah pertandingan dimulai.
            </p>
          </div>
        </div>
      )}

      {isNotEnoughTeams && !hasStartedMatches && (
        <div
          className={cn(
            'flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10',
            'border border-amber-500/30 text-amber-300 text-xs'
          )}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="font-bold uppercase tracking-wider text-amber-400">
              Jumlah Tim Belum Mencukupi
            </p>
            <p className="mt-0.5 text-amber-300/90 leading-relaxed">
              Kategori ini baru memiliki {confirmedCount} tim berstatus confirmed.
              Minimal dibutuhkan 2 tim terkonfirmasi untuk membuat drawing grup.
            </p>
          </div>
        </div>
      )}

      {/* Grid Informasi Simulasi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Confirmed Teams */}
        <div
          className={cn(
            'p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800',
            'flex items-center gap-3.5'
          )}
        >
          <div className="p-3 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Tim Confirmed
            </p>
            <p className="font-[family-name:var(--font-anton)] text-2xl text-white tracking-wide">
              {confirmedCount}{' '}
              <span className="text-xs font-sans font-normal text-zinc-400">Tim</span>
            </p>
          </div>
        </div>

        {/* Groups Distribution */}
        <div
          className={cn(
            'p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800',
            'flex items-center gap-3.5'
          )}
        >
          <div
            className={cn(
              'p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20',
              'text-emerald-400'
            )}
          >
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Format Grup ({targetGroupSize}/grup)
            </p>
            <p className="font-[family-name:var(--font-anton)] text-2xl text-white tracking-wide">
              {previewGroupSizes.length}{' '}
              <span className="text-xs font-sans font-normal text-zinc-400">
                Grup {previewGroupSizes.length > 0 && `(${previewGroupSizes.join(', ')})`}
              </span>
            </p>
          </div>
        </div>

        {/* Round Robin Matches */}
        <div
          className={cn(
            'p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800',
            'flex items-center gap-3.5'
          )}
        >
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Match Round Robin
            </p>
            <p className="font-[family-name:var(--font-anton)] text-2xl text-white tracking-wide">
              {estimatedMatchesCount}{' '}
              <span className="text-xs font-sans font-normal text-zinc-400">Match</span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
