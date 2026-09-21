import React from 'react'
import {
    Users,
    Layers,
    CheckCircle2,
    XCircle,
    Loader2,
    Plus,
    Tag,
} from 'lucide-react'
import { Badge, Switch, Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import { CategoryWithTeamCount, PartnerType, CategoryLevel } from '@/types/domain'

interface CategoryTableProps {
    categories: CategoryWithTeamCount[]
    isLoading: boolean
    togglingCategoryId: string | null
    onToggleActive: (categoryId: string, currentStatus: boolean) => void
    onOpenAddModal: () => void
}

// Module-level constants sesuai docs/component-architecture.md §G & §H
const TABLE_HEADERS = [
    { label: 'Kategori', align: 'left' },
    { label: 'Tipe Partner', align: 'left' },
    { label: 'Skill Level', align: 'left' },
    { label: 'Tim Terdaftar', align: 'center' },
    { label: 'Status & Pendaftaran', align: 'right' },
] as const

const PARTNER_TYPE_CONFIG: Record<
    PartnerType,
    { label: string; variant: 'neutral' | 'success' | 'warning' }
> = {
    fix: { label: 'Fix Partner', variant: 'neutral' },
    mix: { label: 'Mix Partner', variant: 'warning' },
}

const CATEGORY_LEVEL_CONFIG: Record<
    CategoryLevel,
    { label: string; variant: 'neutral' | 'success' | 'warning' }
> = {
    beginner: { label: 'Beginner', variant: 'neutral' },
    lower_bronze: { label: 'Lower Bronze', variant: 'warning' },
    bronze: { label: 'Bronze', variant: 'success' },
}

function formatPartnerType(type: PartnerType | string) {
    return PARTNER_TYPE_CONFIG[type as PartnerType] ?? {
        label: String(type),
        variant: 'neutral' as const,
    }
}

function formatCategoryLevel(level: CategoryLevel | string) {
    return CATEGORY_LEVEL_CONFIG[level as CategoryLevel] ?? {
        label: String(level),
        variant: 'neutral' as const,
    }
}

/**
 * CategoryTable
 * Presentational dumb component untuk menampilkan daftar kategori turnamen
 * dengan toggle status pendaftaran inline.
 * Mematuhi docs/component-architecture.md §A, §B, §G, §H.
 */
export function CategoryTable({
    categories,
    isLoading,
    togglingCategoryId,
    onToggleActive,
    onOpenAddModal,
}: CategoryTableProps) {
    if (isLoading) {
        return (
            <Card
                variant="bordered"
                className="bg-zinc-900 border-zinc-800 p-8"
            >
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <p className="text-sm font-medium">Memuat data kategori turnamen...</p>
                </div>
            </Card>
        )
    }

    if (categories.length === 0) {
        return (
            <Card
                variant="bordered"
                className="bg-zinc-900 border-zinc-800 p-8 sm:p-12 text-center space-y-4"
            >
                <div
                    className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center"
                >
                    <Tag className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-lg font-bold text-white">
                        Belum Ada Kategori Turnamen
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Kategori turnamen merupakan prasyarat sebelum peserta dapat mendaftar dan proses drawing grup dijalankan. Buat kategori pertama Anda sekarang.
                    </p>
                </div>
                <div>
                    <Button type="button" variant="primary" size="md" onClick={onOpenAddModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Kategori Pertama
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Desktop Table View */}
            <div
                className="hidden md:block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-xl shadow-black/30"
            >
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr
                            className="border-b border-zinc-800 bg-zinc-950/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400"
                        >
                            {TABLE_HEADERS.map((header) => (
                                <th
                                    key={header.label}
                                    className={cn('px-5 py-3.5', {
                                        'text-center': header.align === 'center',
                                        'text-right': header.align === 'right',
                                        'text-left': header.align === 'left',
                                    })}
                                >
                                    {header.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm">
                        {categories.map((category) => {
                            const partnerInfo = formatPartnerType(category.partner_type)
                            const levelInfo = formatCategoryLevel(category.level)
                            const isToggling = togglingCategoryId === category.id
                            const isActive = Boolean(category.is_active)

                            return (
                                <tr
                                    key={category.id}
                                    className="hover:bg-zinc-800/40 transition-colors"
                                >
                                    {/* Kategori Name */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border',
                                                    {
                                                        'bg-lime-400/15 border-lime-400/30 text-lime-400':
                                                            isActive,
                                                        'bg-zinc-800 border-zinc-700 text-zinc-400':
                                                            !isActive,
                                                    }
                                                )}
                                            >
                                                <Layers className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-white block">
                                                    {category.name}
                                                </span>
                                                <span className="text-[11px] text-zinc-500 font-mono">
                                                    ID: {category.id.slice(0, 8)}...
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Partner Type */}
                                    <td className="px-5 py-4">
                                        <Badge variant={partnerInfo.variant} size="sm">
                                            {partnerInfo.label}
                                        </Badge>
                                    </td>

                                    {/* Level */}
                                    <td className="px-5 py-4">
                                        <Badge variant={levelInfo.variant} size="sm">
                                            {levelInfo.label}
                                        </Badge>
                                    </td>

                                    {/* Tim Terdaftar */}
                                    <td className="px-5 py-4 text-center">
                                        <span
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 font-mono font-bold text-xs text-zinc-200"
                                        >
                                            <Users className="w-3.5 h-3.5 text-zinc-400" />
                                            {category.team_count} Tim
                                        </span>
                                    </td>

                                    {/* Status & Inline Switch Toggle */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="text-right">
                                                <span
                                                    className={cn(
                                                        'text-xs font-bold flex items-center justify-end gap-1',
                                                        {
                                                            'text-lime-400': isActive,
                                                            'text-zinc-500': !isActive,
                                                        }
                                                    )}
                                                >
                                                    {isActive ? (
                                                        <>
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" />
                                                            Pendaftaran Dibuka
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            Ditutup
                                                        </>
                                                    )}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 block font-mono">
                                                    {isActive ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <Switch
                                                    id={`switch-${category.id}`}
                                                    checked={isActive}
                                                    disabled={isToggling}
                                                    onChange={() =>
                                                        onToggleActive(category.id, isActive)
                                                    }
                                                />
                                                {isToggling && (
                                                    <div
                                                        className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded-full"
                                                    >
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-lime-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
                {categories.map((category) => {
                    const partnerInfo = formatPartnerType(category.partner_type)
                    const levelInfo = formatCategoryLevel(category.level)
                    const isToggling = togglingCategoryId === category.id
                    const isActive = Boolean(category.is_active)

                    return (
                        <Card
                            key={category.id}
                            variant="bordered"
                            className="bg-zinc-900/80 border-zinc-800 p-4 space-y-3.5 rounded-2xl shadow-md"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h4 className="font-bold text-white text-base">
                                        {category.name}
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        <Badge variant={partnerInfo.variant} size="sm">
                                            {partnerInfo.label}
                                        </Badge>
                                        <Badge variant={levelInfo.variant} size="sm">
                                            {levelInfo.label}
                                        </Badge>
                                    </div>
                                </div>
                                <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 font-mono font-bold text-xs text-zinc-300"
                                >
                                    <Users className="w-3 h-3 text-zinc-400" />
                                    {category.team_count}
                                </span>
                            </div>

                            <div
                                className="flex items-center justify-between pt-3 border-t border-zinc-800"
                            >
                                <span className="text-xs text-zinc-400 font-medium">
                                    {isActive ? 'Pendaftaran Dibuka' : 'Pendaftaran Ditutup'}
                                </span>
                                <div className="flex items-center gap-2">
                                    {isToggling && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-lime-400" />
                                    )}
                                    <Switch
                                        id={`switch-mobile-${category.id}`}
                                        checked={isActive}
                                        disabled={isToggling}
                                        onChange={() => onToggleActive(category.id, isActive)}
                                    />
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
