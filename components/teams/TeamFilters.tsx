import React from 'react'
import { Category } from '@/types/domain'
import { formatCategoryBadge } from '@/utils/format'
import { SelectInput } from '@/components/ui'
import { cn } from '@/lib/utils'

interface TeamFiltersProps {
    statusFilter: string
    onStatusChange: (status: string) => void
    categoryFilter: string
    onCategoryChange: (categoryId: string) => void
    categories: Category[]
    totalCount: number
}

const STATUS_TABS = [
    { id: 'all', label: 'Semua' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'rejected', label: 'Rejected' },
] as const

/**
 * TeamFilters (Presentational-only)
 * Filter bar status tab dan pilihan kategori turnamen
 * Mematuhi docs/component-architecture.md §G.
 */
export function TeamFilters({
    statusFilter,
    onStatusChange,
    categoryFilter,
    onCategoryChange,
    categories,
    totalCount,
}: TeamFiltersProps) {

    const categoryOptions = [
        { value: 'all', label: 'Semua Kategori' },
        ...categories.map((cat) => ({
            value: cat.id,
            label: `${cat.name} (${formatCategoryBadge(cat.partner_type, cat.level)})`,
        })),
    ]

    return (
        <div
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 p-3 sm:p-4 rounded-xl border border-zinc-800"
        >
            {/* Status Tabs */}
            <div
                className="flex flex-wrap items-center gap-1 bg-zinc-800/60 border border-zinc-700/50 p-1 rounded-lg"
            >
                {STATUS_TABS.map((tab) => {
                    const isActive = statusFilter === tab.id
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onStatusChange(tab.id)}
                            className={cn(
                                'px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer',
                                {
                                    'bg-zinc-700 text-white shadow-xs': isActive,
                                    'text-zinc-400 hover:text-white': !isActive,
                                }
                            )}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Category Dropdown & Counter */}
            <div className="flex items-center gap-3">
                <div className="text-xs text-zinc-400 shrink-0">
                    Total:{' '}
                    <strong className="text-zinc-200">
                        {totalCount} Tim
                    </strong>
                </div>

                <SelectInput
                    id="category-filter"
                    aria-label="Filter Kategori Turnamen"
                    value={categoryFilter}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    containerClassName="min-w-[200px]"
                    className="!py-1.5 !px-3 !text-xs !rounded-lg !pr-8"
                    options={categoryOptions}
                />
            </div>
        </div>
    )
}
