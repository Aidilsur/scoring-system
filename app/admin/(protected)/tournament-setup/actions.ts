'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
    tournamentSettingsSchema,
    TournamentSettingsInput,
} from '@/lib/validations/tournament-settings'
import { TournamentSettings } from '@/types/domain'

export interface TournamentActionResponse {
    success: boolean
    message: string
    data?: TournamentSettings
    errors?: Record<string, string>
}

/**
 * Server Action: Menyimpan atau memperbarui konfigurasi turnamen (tournament_settings)
 * Berfungsi untuk mode create (jika belum ada) atau update (jika sudah ada row).
 */
export async function saveTournamentSettingsAction(
    input: TournamentSettingsInput,
    existingId?: string
): Promise<TournamentActionResponse> {
    try {
        const supabase = await createClient()

        // 1. Verifikasi autentikasi admin
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

        // 2. Validasi input menggunakan Zod schema
        const validation = tournamentSettingsSchema.safeParse(input)
        if (!validation.success) {
            const fieldErrors: Record<string, string> = {}
            for (const issue of validation.error.issues) {
                const fieldName = issue.path[0]?.toString() || 'general'
                fieldErrors[fieldName] = issue.message
            }
            return {
                success: false,
                message: validation.error.issues[0]?.message || 'Data pengaturan turnamen tidak valid.',
                errors: fieldErrors,
            }
        }

        const validData = validation.data

        // 3. Tentukan apakah melakukan update atau insert
        let targetId = existingId

        if (!targetId) {
            // Cek apakah sudah ada row tournament_settings di database
            const { data: existingRow } = await supabase
                .from('tournament_settings')
                .select('id')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (existingRow?.id) {
                targetId = existingRow.id
            }
        }

        let savedData: TournamentSettings

        if (targetId) {
            // Mode Update
            const { data, error: updateError } = await supabase
                .from('tournament_settings')
                .update({
                    name: validData.name,
                    team_per_group: validData.team_per_group,
                    golden_point_enabled: validData.golden_point_enabled,
                    third_place_enabled: validData.third_place_enabled,
                    number_of_courts: validData.number_of_courts,
                    match_duration_minutes: validData.match_duration_minutes,
                    daily_start_time: validData.daily_start_time,
                    daily_end_time: validData.daily_end_time,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', targetId)
                .select()
                .single()

            if (updateError || !data) {
                console.error('Update Tournament Settings Error:', updateError?.message)
                return {
                    success: false,
                    message: `Gagal memperbarui pengaturan: ${updateError?.message || 'Terjadi kesalahan sistem'}`,
                }
            }
            savedData = data as TournamentSettings
        } else {
            // Mode Create (Insert pertama kali)
            const { data, error: insertError } = await supabase
                .from('tournament_settings')
                .insert({
                    name: validData.name,
                    team_per_group: validData.team_per_group,
                    golden_point_enabled: validData.golden_point_enabled,
                    third_place_enabled: validData.third_place_enabled,
                    number_of_courts: validData.number_of_courts,
                    match_duration_minutes: validData.match_duration_minutes,
                    daily_start_time: validData.daily_start_time,
                    daily_end_time: validData.daily_end_time,
                    status: 'draft',
                })
                .select()
                .single()

            if (insertError || !data) {
                console.error('Insert Tournament Settings Error:', insertError?.message)
                return {
                    success: false,
                    message: `Gagal membuat pengaturan turnamen: ${insertError?.message || 'Terjadi kesalahan sistem'}`,
                }
            }
            savedData = data as TournamentSettings
        }

        // 4. Sinkronisasi tabel courts (jika jumlah court bertambah)
        try {
            const { data: existingCourts } = await supabase
                .from('courts')
                .select('id, name')
                .eq('tournament_id', savedData.id)

            const currentCourtCount = existingCourts?.length || 0
            if (currentCourtCount < validData.number_of_courts) {
                const newCourts = []
                for (let i = currentCourtCount + 1; i <= validData.number_of_courts; i++) {
                    newCourts.push({
                        tournament_id: savedData.id,
                        name: `Court ${i}`,
                    })
                }
                if (newCourts.length > 0) {
                    await supabase.from('courts').insert(newCourts)
                }
            }
        } catch (courtErr) {
            // Non-fatal error, log saja
            console.warn('Sync courts warning:', courtErr)
        }

        // 5. Revalidate cache halaman setup
        revalidatePath('/admin/tournament-setup')
        revalidatePath('/admin')

        return {
            success: true,
            message: 'Pengaturan turnamen berhasil disimpan.',
            data: savedData,
        }
    } catch (err: unknown) {
        console.error('Unexpected Tournament Settings Error:', err)
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan sistem saat menyimpan pengaturan turnamen.',
        }
    }
}
