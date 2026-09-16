'use client'

import React from 'react'
import Link from 'next/link'
import {
    Trophy,
    RotateCw,
    Play,
    Sparkles,
    AlertCircle,
    Info,
    Calendar,
    Layers,
    Crown,
    ShieldAlert,
    CheckCircle2,
} from 'lucide-react'
import { useBracketManagement } from '@/hooks/useBracketManagement'
import { SelectInput, Button, Card, Badge } from '@/components/ui'
import { BracketPairingCard } from './BracketPairingCard'
import { FinalPairingCard } from './FinalPairingCard'
import { BracketStatusAlert } from './BracketStatusAlert'

export interface BracketManagementViewProps {
    initialCategoryId?: string
}

export function BracketManagementView({ initialCategoryId }: BracketManagementViewProps) {
    const {
        categories,
        isLoadingCategories,
        isCategoriesError,
        categoriesError,
        selectedCategoryId,
        setSelectedCategoryId,
        bracketData,
        isLoadingBracket,
        isRefetchingBracket,
        refetchBracket,
        handleGenerateBracket,
        handleResetBracket,
        handleGenerateFinal,
        handleResetFinal,
        isGenerating,
        isResetting,
        isGeneratingFinal,
        isResettingFinal,
    } = useBracketManagement(initialCategoryId)

    const categoryOptions = categories.map((cat) => ({
        value: cat.id,
        label: `${cat.name} (${cat.partner_type.toUpperCase()} - ${cat.level.toUpperCase()})`,
    }))

    // Guard: Belum ada kategori yang memiliki grup
    if (!isLoadingCategories && categories.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                            <Link href="/admin" className="hover:text-lime-400 transition-colors">
                                Admin
                            </Link>
                            <span>/</span>
                            <span className="text-zinc-200 font-medium">Bracket Knockout</span>
                        </div>
                        <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight">
                            Bracket Babak Gugur
                        </h1>
                    </div>
                </div>

                <Card className="p-8 text-center max-w-xl mx-auto space-y-4 bg-zinc-900/60 border-zinc-800">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-base font-bold text-white">Belum Ada Kategori Dengan Grup</h2>
                        <p className="text-xs text-zinc-400 max-w-md mx-auto">
                            Tahap knockout membutuhkan pembagian grup babak penyisihan terlebih dahulu. Silakan lakukan proses drawing grup untuk kategori turnamen.
                        </p>
                    </div>
                    <Link
                        href="/admin/draw"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 text-xs font-bold transition shadow-lg shadow-lime-400/20"
                    >
                        Ke Menu Drawing Grup
                    </Link>
                </Card>
            </div>
        )
    }

    const isTwoGroups = bracketData?.isTwoGroups ?? false
    const isGroupStageComplete = bracketData?.isGroupStageComplete ?? false
    const groupCount = bracketData?.groupCount ?? 0
    const totalGroupMatches = bracketData?.totalGroupMatches ?? 0
    const remainingGroupMatches = bracketData?.remainingGroupMatches ?? 0
    const hasExistingBracket = bracketData?.hasExistingBracket ?? false
    const hasStartedSemifinals = bracketData?.hasStartedSemifinals ?? false
    const semifinalMatches = bracketData?.semifinalMatches ?? []

    // Babak Final & Perebutan Juara 3
    const isSemifinalComplete = bracketData?.isSemifinalComplete ?? false
    const finalMatch = bracketData?.finalMatch ?? null
    const thirdPlaceMatch = bracketData?.thirdPlaceMatch ?? null
    const hasExistingFinal = bracketData?.hasExistingFinal ?? false
    const hasStartedFinalStage = bracketData?.hasStartedFinalStage ?? false
    const thirdPlaceEnabled = bracketData?.thirdPlaceEnabled ?? false

    // Syarat tombol Generate Semifinal Aktif:
    // 1. Tepat 2 grup (isTwoGroups)
    // 2. Fase grup selesai (isGroupStageComplete)
    // 3. Semifinal belum dimulai (jika sudah di-generate sebelumnya)
    const canGenerate = isTwoGroups && isGroupStageComplete && !hasStartedSemifinals

    return (
        <div className="space-y-8">
            {/* Top Header & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                        <Link href="/admin" className="hover:text-lime-400 transition-colors">
                            Admin
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-200 font-medium">Bracket Knockout</span>
                    </div>
                    <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight">
                        Bracket Babak Gugur
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        Generate dan pantau babak semifinal sistem gugur (pola silang Juara vs Runner-up) setelah fase grup tuntas.
                    </p>
                </div>

                {/* Manual Refresh Button */}
                <button
                    type="button"
                    onClick={() => refetchBracket()}
                    disabled={isLoadingBracket || isRefetchingBracket}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition cursor-pointer disabled:opacity-50"
                >
                    <RotateCw
                        className={`w-3.5 h-3.5 ${
                            isRefetchingBracket ? 'animate-spin text-lime-400' : ''
                        }`}
                    />
                    Segarkan Data
                </button>
            </div>

            {/* Selection & Action Panel */}
            <Card className="p-6 bg-zinc-900/80 border-zinc-800 shadow-xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    {/* Category Dropdown */}
                    <div className="md:col-span-2">
                        <SelectInput
                            label="Pilih Kategori Turnamen"
                            value={selectedCategoryId}
                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                            options={categoryOptions}
                            disabled={isLoadingCategories || isGenerating}
                            helperText="Hanya menampilkan kategori yang grupnya telah di-generate."
                        />
                    </div>

                    {/* Generate Button */}
                    <div className="flex flex-col gap-2">
                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            isLoading={isGenerating}
                            loadingText="Memproses..."
                            disabled={!canGenerate || isGenerating || isResetting}
                            onClick={handleGenerateBracket}
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            {hasExistingBracket ? 'Regenerate Bracket Semifinal' : 'Generate Bracket Semifinal'}
                        </Button>
                    </div>
                </div>

                {/* Status Alert Banner */}
                {bracketData && (
                    <BracketStatusAlert
                        groupCount={groupCount}
                        isTwoGroups={isTwoGroups}
                        isGroupStageComplete={isGroupStageComplete}
                        totalGroupMatches={totalGroupMatches}
                        remainingGroupMatches={remainingGroupMatches}
                        hasExistingBracket={hasExistingBracket}
                    />
                )}
            </Card>

            {/* Semifinal Pairings Display */}
            {hasExistingBracket && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="font-[family-name:var(--font-anton)] text-2xl text-white uppercase tracking-tight flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-lime-400" />
                                Pasangan Semifinal
                            </h2>
                            <p className="text-xs text-zinc-400">
                                Pasangan hasil drawing pola silang: Juara Grup A vs Runner-up Grup B, Juara Grup B vs Runner-up Grup A.
                            </p>
                        </div>

                        {!hasStartedSemifinals && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                isLoading={isResetting}
                                loadingText="Mereset..."
                                disabled={isResetting || isGenerating}
                                onClick={handleResetBracket}
                                className="text-xs border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/50"
                            >
                                Reset Bracket
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {semifinalMatches.map((match, idx) => (
                            <BracketPairingCard
                                key={match.id}
                                match={match}
                                matchIndex={idx}
                            />
                        ))}
                    </div>

                    {/* Schedule Link Card */}
                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-lime-400" />
                            <span>Pertandingan semifinal belum memiliki court dan jam tanding?</span>
                        </div>
                        <Link
                            href="/admin/schedule"
                            className="text-lime-400 font-bold hover:underline"
                        >
                            Atur Jadwal di Modul Schedule &rarr;
                        </Link>
                    </div>

                    {/* ------------------------------------------------------------------ */}
                    {/* Final & Third Place Stage Section (Flow Step 1-4)                  */}
                    {/* ------------------------------------------------------------------ */}
                    <div className="pt-8 border-t border-zinc-800 space-y-6">
                        <Card className="p-6 bg-zinc-900/80 border-zinc-800 shadow-xl space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                                            Puncak Turnamen
                                        </span>
                                        {hasStartedFinalStage && (
                                            <Badge variant="danger" className="text-[10px] font-mono uppercase">
                                                Pertandingan Dimulai
                                            </Badge>
                                        )}
                                    </div>
                                    <h2 className="font-[family-name:var(--font-anton)] text-2xl sm:text-3xl text-white uppercase tracking-tight flex items-center gap-2 mt-0.5">
                                        <Crown className="w-6 h-6 text-amber-400" />
                                        Babak Final {thirdPlaceEnabled ? '& Perebutan Juara 3' : ''}
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Pairing otomatis berdasarkan pemenang dan tim yang kalah di babak semifinal.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {hasExistingFinal && !hasStartedFinalStage && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            isLoading={isResettingFinal}
                                            loadingText="Mereset..."
                                            disabled={isResettingFinal || isGeneratingFinal}
                                            onClick={handleResetFinal}
                                            className="text-xs border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/50"
                                        >
                                            Reset Final
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="md"
                                        isLoading={isGeneratingFinal}
                                        loadingText="Memproses..."
                                        disabled={
                                            !isSemifinalComplete ||
                                            hasStartedFinalStage ||
                                            isGeneratingFinal ||
                                            isResettingFinal
                                        }
                                        onClick={handleGenerateFinal}
                                        className="flex items-center justify-center gap-2 !bg-amber-400 hover:!bg-amber-300 !text-zinc-950 shadow-lg shadow-amber-400/20"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        {hasExistingFinal
                                            ? thirdPlaceEnabled
                                                ? 'Regenerate Final & Juara 3'
                                                : 'Regenerate Final'
                                            : thirdPlaceEnabled
                                            ? 'Generate Final & Perebutan Juara 3'
                                            : 'Generate Final'}
                                    </Button>
                                </div>
                            </div>

                            {/* Status Alerts for Final */}
                            {!isSemifinalComplete && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
                                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-amber-200">
                                            Babak Semifinal Belum Selesai
                                        </p>
                                        <p className="leading-relaxed">
                                            Kedua pertandingan semifinal harus berstatus <strong>completed</strong> dengan pemenang yang sah sebelum bracket Babak Final {thirdPlaceEnabled ? '& Perebutan Juara 3' : ''} dapat di-generate.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {isSemifinalComplete && !hasExistingFinal && (
                                <div className="p-4 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-start gap-3 text-lime-300 text-xs">
                                    <CheckCircle2 className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-lime-200">
                                            Babak Semifinal Selesai — Siap Generate Final!
                                        </p>
                                        <p className="leading-relaxed">
                                            Kedua match semifinal telah tuntas. Klik tombol <strong>&quot;Generate Final {thirdPlaceEnabled ? '& Perebutan Juara 3' : ''}&quot;</strong> di atas untuk membuat jadwal pertandingan penentuan juara turnamen.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {hasStartedFinalStage && (
                                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-start gap-3 text-rose-300 text-xs">
                                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-rose-200">
                                            Proteksi Pertandingan Aktif
                                        </p>
                                        <p className="leading-relaxed">
                                            Pertandingan babak final atau perebutan juara 3 sedang live atau telah selesai. Fitur regenerate dan reset dikunci demi integritas turnamen.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Display Final & Third Place Matches */}
                        {hasExistingFinal && finalMatch && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Final Card */}
                                    <FinalPairingCard match={finalMatch} type="final" />

                                    {/* Third Place Card (if enabled and exists) */}
                                    {thirdPlaceEnabled && thirdPlaceMatch && (
                                        <FinalPairingCard match={thirdPlaceMatch} type="third_place" />
                                    )}
                                </div>

                                {/* Schedule Link Card for Final Stage */}
                                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-amber-400" />
                                        <span>Pertandingan babak final belum memiliki court dan jam tanding?</span>
                                    </div>
                                    <Link
                                        href="/admin/schedule"
                                        className="text-amber-400 font-bold hover:underline"
                                    >
                                        Atur Jadwal di Modul Schedule &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
