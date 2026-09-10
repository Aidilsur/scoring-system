import { z } from 'zod'

/**
 * Validasi parameter generate jadwal pertandingan kategori
 */
export const generateScheduleSchema = z.object({
    categoryId: z.string().uuid({ message: 'Category ID tidak valid (harus berupa UUID)' }),
})

export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>
