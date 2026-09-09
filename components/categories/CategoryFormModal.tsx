import React from 'react'
import { X, Sparkles, Plus, FolderPlus } from 'lucide-react'
import { TextInput, SelectInput, Switch, Button } from '@/components/ui'
import { CategoryFormValues } from '@/hooks/useCategoriesManagement'
import { PartnerType, CategoryLevel } from '@/types/domain'

export interface CategoryFormModalProps {
    isOpen: boolean
    onClose: () => void
    values: CategoryFormValues
    fieldErrors: Record<string, string>
    isSubmitting: boolean
    onFieldChange: <K extends keyof CategoryFormValues>(
        field: K,
        val: CategoryFormValues[K]
    ) => void
    onApplySuggestedName: () => void
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

// Module-level constants sesuai docs/component-architecture.md §G & §H
const PARTNER_TYPE_OPTIONS = [
    { value: 'fix', label: 'Fix Partner (Pasangan Tetap)' },
    { value: 'mix', label: 'Mix Partner (Pasangan Ganda Campuran/Bebas)' },
] as const

const LEVEL_OPTIONS = [
    { value: 'beginner', label: 'Beginner (Pemula)' },
    { value: 'lower_bronze', label: 'Lower Bronze' },
    { value: 'bronze', label: 'Bronze' },
] as const

/**
 * CategoryFormModal
 * Dumb / Presentational Modal component untuk formulir tambah kategori baru.
 * Mematuhi docs/component-architecture.md §A, §B, §G, §H.
 */
export function CategoryFormModal({
    isOpen,
    onClose,
    values,
    fieldErrors,
    isSubmitting,
    onFieldChange,
    onApplySuggestedName,
    onSubmit,
}: CategoryFormModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl shadow-black/80 my-8 text-white">
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-lime-400/15 border border-lime-400/30 text-lime-400 flex items-center justify-center">
                            <FolderPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                                Tambah Kategori Turnamen
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Tentukan kombinasi tipe partner dan level turnamen.
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white p-1.5 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Form Body */}
                <form onSubmit={onSubmit} className="space-y-5">
                    {/* Tipe Partner & Level Dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectInput
                            id="partner_type"
                            name="partner_type"
                            label="Tipe Partner"
                            required
                            value={values.partner_type}
                            onChange={(e) =>
                                onFieldChange('partner_type', e.target.value as PartnerType)
                            }
                            options={PARTNER_TYPE_OPTIONS.map((opt) => ({
                                value: opt.value,
                                label: opt.label,
                            }))}
                            error={fieldErrors.partner_type}
                            helperText="Format pasangan pemain saat mendaftar."
                        />

                        <SelectInput
                            id="level"
                            name="level"
                            label="Skill Level"
                            required
                            value={values.level}
                            onChange={(e) =>
                                onFieldChange('level', e.target.value as CategoryLevel)
                            }
                            options={LEVEL_OPTIONS.map((opt) => ({
                                value: opt.value,
                                label: opt.label,
                            }))}
                            error={fieldErrors.level}
                            helperText="Tingkatan keahlian peserta turnamen."
                        />
                    </div>

                    {/* Nama Kategori */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="category_name"
                                className="block text-xs font-bold uppercase tracking-wider text-zinc-300"
                            >
                                Nama Kategori <span className="text-rose-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={onApplySuggestedName}
                                className="text-[11px] font-bold text-lime-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                                <Sparkles className="w-3 h-3" />
                                Gunakan Format Standar
                            </button>
                        </div>
                        <TextInput
                            id="category_name"
                            name="name"
                            placeholder="Contoh: Fix Partner - Bronze"
                            value={values.name}
                            onChange={(e) => onFieldChange('name', e.target.value)}
                            error={fieldErrors.name}
                            helperText="Nama ini akan tampil di form pendaftaran dan bagan turnamen."
                        />
                    </div>

                    {/* Switch Status Aktif */}
                    <div className="pt-2 border-t border-zinc-800">
                        <Switch
                            id="is_active"
                            name="is_active"
                            checked={values.is_active}
                            onChange={(checked) => onFieldChange('is_active', checked)}
                            label="Buka Pendaftaran Kategori Ini Langsung"
                            description="Jika aktif, calon peserta dapat langsung memilih kategori ini pada formulir pendaftaran."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Simpan Kategori
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
