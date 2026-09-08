import { z } from 'zod'

/**
 * Zod Schema untuk validasi pengaturan turnamen (tournament_settings)
 * Digunakan untuk validasi client-side dan server-side
 */
export const tournamentSettingsSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, { message: 'Nama turnamen minimal 2 karakter' })
        .max(100, { message: 'Nama turnamen maksimal 100 karakter' }),

    team_per_group: z.coerce
        .number()
        .int({ message: 'Ukuran grup harus berupa bilangan bulat' })
        .min(2, { message: 'Ukuran grup minimal 2 tim per grup' })
        .max(16, { message: 'Ukuran grup maksimal 16 tim per grup' })
        .default(4),

    golden_point_enabled: z
        .boolean()
        .default(true),

    third_place_enabled: z
        .boolean()
        .default(false),

    number_of_courts: z.coerce
        .number()
        .int({ message: 'Jumlah court harus berupa bilangan bulat' })
        .min(1, { message: 'Minimal harus ada 1 court' })
        .max(30, { message: 'Maksimal 30 court' })
        .default(1),
})

export type TournamentSettingsInput = z.infer<typeof tournamentSettingsSchema>
