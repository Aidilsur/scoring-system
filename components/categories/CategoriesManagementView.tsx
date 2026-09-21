'use client'

import React from 'react'
import Link from 'next/link'
import {
    Layers,
    Plus,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    X,
    Users,
    ShieldAlert,
    Info,
    Sliders,
} from 'lucide-react'
import { useCategoriesManagement } from '@/hooks/useCategoriesManagement'
import { CategoryTable } from './CategoryTable'
import { CategoryFormModal } from './CategoryFormModal'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

// Module-level constants sesuai docs/component-architecture.md §G & §H
const CATEGORY_RULES_INFO = [
    {
        label: 'Tipe Partner (§4.1)',
        description:
            'Fix Partner (pasangan tetap) atau Mix Partner (ganda campuran/pasangan bebas). Pairing ditentukan saat pendaftaran, bukan diacak sistem.',
    },
    {
        label: 'Tingkatan Level (§4.1)',
        description:
            'Beginner, Lower Bronze, atau Bronze. Memisahkan bagan pertandingan agar kompetisi seimbang.',
    },
    {
        label: 'Kebijakan Hapus Kategori (§4.1 & DB Schema)',
        description:
            'Kategori hanya dapat dihapus jika berstatus nonaktif dan tidak memiliki tim terdaftar (ON DELETE RESTRICT). Gunakan tombol toggle status untuk menutup pendaftaran terlebih dahulu.',
    },
    {
        label: 'Prasyarat Drawing (§4.3)',
        description:
            'Hanya tim berstatus Confirmed di dalam kategori aktif yang diikutsertakan saat proses drawing dan pembagian grup.',
    },
] as const

/**
 * CategoriesManagementView
 * Container component yang menghubungkan hook useCategoriesManagement ke dumb components.
 * Mematuhi docs/component-architecture.md §A, §B, §G, §H.
 */
export function CategoriesManagementView() {
    const {
        categories,
        isLoading,
        isError,
        error,
        refetch,
        isAddModalOpen,
        openAddModal,
        closeAddModal,
        values,
        fieldErrors,
        isSubmitting,
        onFieldChange,
        applySuggestedName,
        handleSubmit,
        toggleActive,
        togglingCategoryId,
        deleteCategory,
        deletingCategoryId,
        toast,
        clearToast,
    } = useCategoriesManagement()

    const totalCategories = categories.length
    const activeCategories = categories.filter((c) => c.is_active).length
    const totalTeams = categories.reduce((sum, c) => sum + (c.team_count || 0), 0)

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
                            Kategori Turnamen
                        </span>
                    </div>
                    <h1
                        className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight"
                    >
                        Kelola Kategori Turnamen
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        Atur kelas turnamen dinamis (kombinasi tipe partner × skill level) sebagai prasyarat pendaftaran dan drawing.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw
                            className={cn(
                                'w-4 h-4 mr-1.5',
                                isLoading && 'animate-spin text-lime-400'
                            )}
                        />
                        Refresh
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={openAddModal}
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Tambah Kategori
                    </Button>
                </div>
            </div>

            {/* Toast Feedback Notification */}
            {toast && (
                <div
                    className={cn(
                        'p-4 rounded-xl border flex items-center justify-between text-xs transition-all shadow-sm',
                        {
                            'bg-lime-400/10 border-lime-400/30 text-lime-300':
                                toast.type === 'success',
                            'bg-rose-500/10 border-rose-500/30 text-rose-300':
                                toast.type !== 'success',
                        }
                    )}
                >
                    <div className="flex items-center gap-2.5 font-medium">
                        {toast.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{toast.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={clearToast}
                        className="text-zinc-400 hover:text-white ml-4 p-1 cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Error State */}
            {isError && (
                <div
                    className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>
                            Gagal memuat data kategori:{' '}
                            {error instanceof Error ? error.message : 'Unknown error'}
                        </span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => refetch()}>
                        Coba Lagi
                    </Button>
                </div>
            )}

            {/* Metric / Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card variant="bordered" className="bg-zinc-900/80 border-zinc-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                                Total Kategori
                            </p>
                            <h3 className="font-[family-name:var(--font-anton)] text-3xl text-white mt-1">
                                {totalCategories}
                            </h3>
                        </div>
                        <div
                            className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center"
                        >
                            <Layers className="w-5 h-5 text-lime-400" />
                        </div>
                    </div>
                </Card>

                <Card variant="bordered" className="bg-zinc-900/80 border-zinc-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                                Kategori Aktif (Buka)
                            </p>
                            <h3 className="font-[family-name:var(--font-anton)] text-3xl text-lime-400 mt-1">
                                {activeCategories}
                            </h3>
                        </div>
                        <div
                            className="w-10 h-10 rounded-xl bg-lime-400/15 border border-lime-400/30 text-lime-400 flex items-center justify-center"
                        >
                            <Sliders className="w-5 h-5" />
                        </div>
                    </div>
                </Card>

                <Card variant="bordered" className="bg-zinc-900/80 border-zinc-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                                Total Tim Terdaftar
                            </p>
                            <h3 className="font-[family-name:var(--font-anton)] text-3xl text-white mt-1">
                                {totalTeams}
                            </h3>
                        </div>
                        <div
                            className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center"
                        >
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Categories Table */}
            <CategoryTable
                categories={categories}
                isLoading={isLoading}
                togglingCategoryId={togglingCategoryId}
                deletingCategoryId={deletingCategoryId}
                onToggleActive={toggleActive}
                onDeleteCategory={deleteCategory}
                onOpenAddModal={openAddModal}
            />

            {/* Petunjuk Aturan Kategori Turnamen (§4.1) */}
            <Card variant="bordered" className="bg-zinc-900/80 border-zinc-800 p-6 space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Info className="w-4 h-4 text-lime-400" />
                    <h4 className="uppercase tracking-wide">
                        Panduan Aturan Kategori Turnamen (docs/business-rules.md §4.1)
                    </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {CATEGORY_RULES_INFO.map((item) => (
                        <div
                            key={item.label}
                            className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1"
                        >
                            <span className="font-bold text-white uppercase tracking-wider block">
                                {item.label}
                            </span>
                            <p className="text-zinc-400 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5"
                >
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <p className="leading-relaxed">
                        <strong className="text-amber-200">Perhatian:</strong> Menutup status aktif kategori akan langsung menyembunyikan kategori tersebut dari halaman pendaftaran publik (<code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono text-amber-200">/register</code>), namun seluruh tim yang sudah terdaftar sebelumnya tetap aman dan dapat diverifikasi maupun diikutsertakan dalam drawing.
                    </p>
                </div>
            </Card>

            {/* Modal Tambah Kategori */}
            <CategoryFormModal
                isOpen={isAddModalOpen}
                onClose={closeAddModal}
                values={values}
                fieldErrors={fieldErrors}
                isSubmitting={isSubmitting}
                onFieldChange={onFieldChange}
                onApplySuggestedName={applySuggestedName}
                onSubmit={handleSubmit}
            />
        </div>
    )
}
