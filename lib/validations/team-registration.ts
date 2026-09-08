import { z } from 'zod'

// Regex nomor handphone / WhatsApp Indonesia:
// Dimulai dengan 08, 628, atau +628, diikuti 7-12 digit angka
const INDONESIA_PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,11}$/

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 Megabytes
export const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
]

/**
 * Zod schema untuk validasi field teks pendaftaran tim
 */
export const teamRegistrationSchema = z.object({
    category_id: z
        .string()
        .min(1, { message: 'Kategori turnamen wajib dipilih' })
        .uuid({ message: 'ID Kategori tidak valid' }),

    player1_name: z
        .string()
        .trim()
        .min(2, { message: 'Nama Pemain 1 minimal 2 karakter' })
        .max(100, { message: 'Nama Pemain 1 maksimal 100 karakter' }),

    player2_name: z
        .string()
        .trim()
        .min(2, { message: 'Nama Pemain 2 minimal 2 karakter' })
        .max(100, { message: 'Nama Pemain 2 maksimal 100 karakter' }),

    phone_number: z
        .string()
        .trim()
        .transform((val) => val.replace(/[\s-]/g, '')) // Hapus spasi dan strip tanda hubung
        .refine((val) => INDONESIA_PHONE_REGEX.test(val), {
            message: 'Format nomor HP/WA tidak valid (contoh: 081234567890 atau +6281234567890)',
        }),

    instagram_handle: z
        .string()
        .trim()
        .min(1, { message: 'Akun Instagram wajib diisi' })
        .max(50, { message: 'Akun Instagram maksimal 50 karakter' })
        .transform((val) => (val.startsWith('@') ? val : `@${val}`)),

    reclub_handle: z
        .string()
        .trim()
        .min(1, { message: 'Akun Reclub wajib diisi' })
        .max(50, { message: 'Akun Reclub maksimal 50 karakter' }),
})

export type TeamRegistrationInput = z.infer<typeof teamRegistrationSchema>

/**
 * Helper validator untuk file bukti pembayaran
 */
export function validatePaymentProofFile(file: unknown): {
    success: boolean
    error?: string
    file?: File
} {
    if (!file || !(file instanceof File) || file.size === 0) {
        return {
            success: false,
            error: 'Bukti pembayaran wajib diunggah',
        }
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            success: false,
            error: 'Ukuran file bukti pembayaran maksimal 5MB',
        }
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return {
            success: false,
            error: 'Format file tidak didukung. Harap unggah gambar (JPG, PNG, WEBP) atau dokumen PDF',
        }
    }

    return {
        success: true,
        file,
    }
}
