import { z } from 'zod'

/**
 * Zod Schema untuk validasi pembuatan / pengubahan kategori turnamen
 * Digunakan untuk validasi client-side dan server-side
 * Sesuai spesifikasi docs/business-rules.md §4.1
 */
export const categorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, { message: 'Nama kategori minimal 2 karakter' })
        .max(100, { message: 'Nama kategori maksimal 100 karakter' }),

    partner_type: z.enum(['fix', 'mix'], {
        message: 'Tipe partner harus dipilih (Fix Partner atau Mix Partner)',
    }),

    level: z.enum(['beginner', 'lower_bronze', 'bronze'], {
        message: 'Level keahlian harus dipilih (Beginner, Lower Bronze, atau Bronze)',
    }),

    is_active: z.boolean().default(true),
})

export type CategoryInput = z.infer<typeof categorySchema>

/**
 * Zod Schema untuk toggle status aktif kategori
 */
export const toggleCategoryActiveSchema = z.object({
    categoryId: z.string().uuid({ message: 'Category ID tidak valid' }),
    isActive: z.boolean(),
})

export type ToggleCategoryActiveInput = z.infer<typeof toggleCategoryActiveSchema>
