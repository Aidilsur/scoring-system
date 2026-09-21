'use server'

import { createClient } from '@/lib/supabase/server'
import { TeamStatus } from '@/types/domain'

interface ActionResponse {
    success: boolean
    message: string
}

/**
 * Server Action: Update status tim (confirmed / rejected)
 * Hanya dapat dijalankan oleh user terautentikasi (admin).
 */
export async function updateTeamStatusAction(
    teamId: string,
    status: 'confirmed' | 'rejected'
): Promise<ActionResponse> {
    try {
        const supabase = await createClient()

        // Verifikasi session admin
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                message: 'Akses ditolak. Silakan login sebagai admin terlebih dahulu.',
            }
        }

        if (!teamId || !['confirmed', 'rejected'].includes(status)) {
            return {
                success: false,
                message: 'Parameter update status tidak valid.',
            }
        }

        const { error: updateError } = await supabase
            .from('teams')
            .update({ status: status as TeamStatus })
            .eq('id', teamId)

        if (updateError) {
            console.error('Update Team Status Error:', updateError.message)
            return {
                success: false,
                message: `Gagal memperbarui status: ${updateError.message}`,
            }
        }

        const statusLabel = status === 'confirmed' ? 'Dikonfirmasi' : 'Ditolak'
        return {
            success: true,
            message: `Tim berhasil diubah statusnya menjadi ${statusLabel}.`,
        }
    } catch (err: unknown) {
        console.error('Unexpected Update Team Status Error:', err)
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan sistem saat memperbarui status tim.',
        }
    }
}

/**
 * Server Action: Buat Signed URL untuk melihat file bukti pembayaran di private bucket
 */
export async function getPaymentProofSignedUrlAction(
    filePath: string
): Promise<{ success: boolean; signedUrl?: string; message?: string }> {
    try {
        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                message: 'Akses ditolak. Anda harus login.',
            }
        }

        if (!filePath) {
            return {
                success: false,
                message: 'Path file bukti pembayaran tidak valid.',
            }
        }

        // Generate Signed URL berlaku selama 1 jam (3600 detik)
        const { data, error } = await supabase.storage
            .from('payment-proofs')
            .createSignedUrl(filePath, 3600)

        if (error || !data?.signedUrl) {
            console.error('Create Signed URL Error:', error?.message)
            return {
                success: false,
                message: error?.message || 'Gagal membuat URL akses berkas bukti bayar.',
            }
        }

        return {
            success: true,
            signedUrl: data.signedUrl,
        }
    } catch (err: unknown) {
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat berkas.',
        }
    }
}

