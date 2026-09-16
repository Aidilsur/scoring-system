'use server'

import { createClient } from '@/lib/supabase/server'
import {
    teamRegistrationSchema,
    validatePaymentProofFile,
} from '@/lib/validations/team-registration'

export interface RegisterActionResponse {
    success: boolean
    message: string
    errors?: Record<string, string>
}

export async function registerTeamAction(
    prevState: RegisterActionResponse | null,
    formData: FormData
): Promise<RegisterActionResponse> {
    try {
        // 1. Ekstrak data field dari FormData
        const rawData = {
            category_id: formData.get('category_id')?.toString() || '',
            player1_name: formData.get('player1_name')?.toString() || '',
            player2_name: formData.get('player2_name')?.toString() || '',
            phone_number: formData.get('phone_number')?.toString() || '',
            instagram_handle: formData.get('instagram_handle')?.toString() || '',
            reclub_handle: formData.get('reclub_handle')?.toString() || '',
        }

        const rawFile = formData.get('payment_proof')

        // 2. Validasi field menggunakan Zod
        const parsedFields = teamRegistrationSchema.safeParse(rawData)
        const parsedFile = validatePaymentProofFile(rawFile)

        const fieldErrors: Record<string, string> = {}

        if (!parsedFields.success) {
            for (const issue of parsedFields.error.issues) {
                const path = issue.path[0]?.toString()
                if (path && !fieldErrors[path]) {
                    fieldErrors[path] = issue.message
                }
            }
        }

        if (!parsedFile.success && parsedFile.error) {
            fieldErrors['payment_proof'] = parsedFile.error
        }

        if (Object.keys(fieldErrors).length > 0) {
            return {
                success: false,
                message: 'Mohon periksa kembali isian formulir Anda.',
                errors: fieldErrors,
            }
        }

        const validatedData = parsedFields.data!
        const fileToUpload = parsedFile.file!

        // 3. Inisialisasi Supabase Client
        const supabase = await createClient()

        // 4. Verifikasi apakah kategori valid dan masih aktif
        const { data: category, error: categoryError } = await supabase
            .from('categories')
            .select('id, name, is_active')
            .eq('id', validatedData.category_id)
            .eq('is_active', true)
            .single()

        if (categoryError || !category) {
            return {
                success: false,
                message: 'Kategori turnamen yang dipilih tidak ditemukan atau sudah tidak aktif.',
                errors: {
                    category_id: 'Kategori tidak aktif atau tidak valid',
                },
            }
        }

        // 5. Upload bukti pembayaran ke Supabase Storage (bucket: 'payment-proofs')
        const fileExt = fileToUpload.name.split('.').pop()?.toLowerCase() || 'jpg'
        const uniqueId = `${Date.now()}_${crypto.randomUUID()}`
        const sanitizedFileName = `${validatedData.category_id}/${uniqueId}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(sanitizedFileName, fileToUpload, {
                cacheControl: '3600',
                upsert: false,
                contentType: fileToUpload.type,
            })

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError)
            return {
                success: false,
                message:
                    `Gagal mengunggah bukti pembayaran: ${uploadError.message}. Pastikan bucket 'payment-proofs' sudah dibuat di Supabase Storage.`,
            }
        }

        const storedPath = uploadData?.path || sanitizedFileName

        // 6. Insert data pendaftaran ke tabel teams dengan status 'pending'
        const { error: insertError } = await supabase.from('teams').insert({
            category_id: validatedData.category_id,
            player1_name: validatedData.player1_name,
            player2_name: validatedData.player2_name,
            phone_number: validatedData.phone_number,
            instagram_handle: validatedData.instagram_handle,
            reclub_handle: validatedData.reclub_handle,
            payment_proof_url: storedPath,
            status: 'pending',
        })

        if (insertError) {
            console.error('Team Insert Error:', insertError)

            // Rollback file upload jika insert gagal
            await supabase.storage.from('payment-proofs').remove([storedPath])

            return {
                success: false,
                message: `Gagal menyimpan data pendaftaran: ${insertError.message}`,
            }
        }

        return {
            success: true,
            message:
                'Pendaftaran berhasil dikirim! Data tim Anda telah tercatat dengan status pending. Panitia akan segera memverifikasi bukti pembayaran Anda.',
        }
    } catch (err: unknown) {
        console.error('Unexpected Register Action Error:', err)
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan sistem yang tidak terduga. Silakan coba kembali.',
        }
    }
}
