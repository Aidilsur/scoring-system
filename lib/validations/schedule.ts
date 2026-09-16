import { z } from 'zod'

/**
 * Validasi parameter generate jadwal pertandingan kategori
 */
export const generateScheduleSchema = z.object({
    categoryId: z.string().uuid({ message: 'Category ID tidak valid (harus berupa UUID)' }),
    round: z.enum(['group', 'semifinal', 'final', 'third_place']).optional().default('group'),
})

export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>
