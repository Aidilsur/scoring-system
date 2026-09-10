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

    match_duration_minutes: z.coerce
        .number()
        .int({ message: 'Estimasi durasi harus berupa bilangan bulat' })
        .min(10, { message: 'Durasi pertandingan minimal 10 menit' })
        .max(240, { message: 'Durasi pertandingan maksimal 240 menit' })
        .default(45),

    daily_start_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
            message: 'Format jam mulai tidak valid (HH:mm)',
        })
        .default('08:00'),

    daily_end_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
            message: 'Format jam selesai tidak valid (HH:mm)',
        })
        .default('18:00'),
}).refine(
    (data) => {
        if (data.daily_start_time && data.daily_end_time) {
            return data.daily_end_time > data.daily_start_time
        }
        return true
    },
    {
        message: 'Jam selesai turnamen harus lebih besar dari jam mulai',
        path: ['daily_end_time'],
    }
)

export type TournamentSettingsInput = z.infer<typeof tournamentSettingsSchema>
