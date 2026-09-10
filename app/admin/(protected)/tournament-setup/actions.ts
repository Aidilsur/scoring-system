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
    warning?: string
    data?: TournamentSettings
    errors?: Record<string, string>
}

/**
 * Server Action: Menyimpan atau memperbarui konfigurasi turnamen (tournament_settings)
 * Berfungsi untuk mode create (jika belum ada) atau update (jika sudah ada row).
 */
function extractCourtNumber(name: string): number {
    const match = name.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : 0
}

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
        let warningMessage: string | undefined = undefined

        if (targetId) {
            // 3.0 Cek apakah ada perubahan jam / durasi saat jadwal match sudah ada
            const { data: currentSettings } = await supabase
                .from('tournament_settings')
                .select('*')
                .eq('id', targetId)
                .maybeSingle()

            if (currentSettings) {
                const currentStart = currentSettings.daily_start_time ? currentSettings.daily_start_time.slice(0, 5) : ''
                const currentEnd = currentSettings.daily_end_time ? currentSettings.daily_end_time.slice(0, 5) : ''
                const newStart = validData.daily_start_time.slice(0, 5)
                const newEnd = validData.daily_end_time.slice(0, 5)

                const isDurationOrTimeChanged =
                    currentSettings.match_duration_minutes !== validData.match_duration_minutes ||
                    currentStart !== newStart ||
                    currentEnd !== newEnd

                if (isDurationOrTimeChanged) {
                    const { data: scheduledMatches, error: schedErr } = await supabase
                        .from('matches')
                        .select('id')
                        .eq('round', 'group')
                        .or('court_id.not.is.null,scheduled_time.not.is.null')
                        .limit(1)

                    if (!schedErr && scheduledMatches && scheduledMatches.length > 0) {
                        warningMessage =
                            'Pengaturan jam/durasi diubah. Jadwal yang sudah dibuat sebelumnya TIDAK otomatis menyesuaikan - silakan Reset & generate ulang jika diperlukan agar konsisten dengan pengaturan baru.'
                    }
                }
            }

            // 3.1 Cek sinkronisasi pengurangan court sebelum update settings (Pengaman)
            const { data: existingCourts, error: fetchCourtsErr } = await supabase
                .from('courts')
                .select('id, name')
                .eq('tournament_id', targetId)

            if (fetchCourtsErr) {
                return {
                    success: false,
                    message: `Gagal membaca data lapangan: ${fetchCourtsErr.message}`,
                    data: (currentSettings as TournamentSettings) || undefined,
                }
            }

            const currentCourts = existingCourts || []
            const currentCourtCount = currentCourts.length

            if (validData.number_of_courts < currentCourtCount) {
                const diff = currentCourtCount - validData.number_of_courts
                // Urutkan lapangan berdasarkan nomor tertinggi ke terendah
                const sortedCourtsDesc = [...currentCourts].sort((a, b) => {
                    const numA = extractCourtNumber(a.name)
                    const numB = extractCourtNumber(b.name)
                    if (numA !== numB) return numB - numA
                    return b.name.localeCompare(a.name)
                })
                const courtsToDelete = sortedCourtsDesc.slice(0, diff)
                const courtsToDeleteIds = courtsToDelete.map((c) => c.id)

                // Cek pertandingan aktif (status 'scheduled' atau 'live') di court yang akan dihapus
                const { data: conflictingMatches, error: matchCheckErr } = await supabase
                    .from('matches')
                    .select('id, court_id, status')
                    .in('court_id', courtsToDeleteIds)
                    .in('status', ['scheduled', 'live'])

                if (matchCheckErr) {
                    return {
                        success: false,
                        message: `Gagal memeriksa status pertandingan di lapangan: ${matchCheckErr.message}`,
                        data: (currentSettings as TournamentSettings) || undefined,
                    }
                }

                if (conflictingMatches && conflictingMatches.length > 0) {
                    const courtMatchCounts: Record<string, number> = {}
                    for (const m of conflictingMatches) {
                        const courtName =
                            courtsToDelete.find((c) => c.id === m.court_id)?.name || 'Lapangan'
                        courtMatchCounts[courtName] = (courtMatchCounts[courtName] || 0) + 1
                    }
                    const conflictDetails = Object.entries(courtMatchCounts)
                        .map(([courtName, count]) => `${courtName} (${count} match)`)
                        .join(', ')

                    return {
                        success: false,
                        message: `Tidak dapat mengurangi jumlah lapangan. Lapangan berikut masih memiliki pertandingan terjadwal/live: ${conflictDetails}. Silakan reset atau ubah jadwal pertandingan terlebih dahulu.`,
                        data: (currentSettings as TournamentSettings) || undefined,
                    }
                }

                // Hapus surplus court
                const { error: deleteCourtsErr } = await supabase
                    .from('courts')
                    .delete()
                    .in('id', courtsToDeleteIds)

                if (deleteCourtsErr) {
                    return {
                        success: false,
                        message: `Gagal menghapus kelebihan lapangan: ${deleteCourtsErr.message}`,
                        data: (currentSettings as TournamentSettings) || undefined,
                    }
                }
            } else if (validData.number_of_courts > currentCourtCount) {
                // Tambah court baru
                const newCourts = []
                for (let i = currentCourtCount + 1; i <= validData.number_of_courts; i++) {
                    newCourts.push({
                        tournament_id: targetId,
                        name: `Court ${i}`,
                    })
                }
                if (newCourts.length > 0) {
                    const { error: insertCourtsErr } = await supabase
                        .from('courts')
                        .insert(newCourts)

                    if (insertCourtsErr) {
                        return {
                            success: false,
                            message: `Gagal menambah lapangan: ${insertCourtsErr.message}`,
                        }
                    }
                }
            }

            // Mode Update Settings
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

            // Inisialisasi lapangan untuk turnamen baru
            const newCourts = []
            for (let i = 1; i <= validData.number_of_courts; i++) {
                newCourts.push({
                    tournament_id: savedData.id,
                    name: `Court ${i}`,
                })
            }
            if (newCourts.length > 0) {
                await supabase.from('courts').insert(newCourts)
            }
        }

        // 5. Revalidate cache halaman setup
        revalidatePath('/admin/tournament-setup')
        revalidatePath('/admin')

        return {
            success: true,
            message: 'Pengaturan turnamen berhasil disimpan.',
            warning: warningMessage,
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
