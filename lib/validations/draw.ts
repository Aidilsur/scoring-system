import { z } from 'zod'

/**
 * Zod Schema untuk validasi input pemilihan kategori pada generate draw
 */
export const generateDrawSchema = z.object({
  categoryId: z
    .string()
    .min(1, { message: 'Kategori turnamen wajib dipilih' })
    .uuid({ message: 'Format ID kategori tidak valid' }),
})

export type GenerateDrawInput = z.infer<typeof generateDrawSchema>
