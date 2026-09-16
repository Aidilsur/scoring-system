'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateScheduleSchema } from '@/lib/validations/schedule'
import {
    generateMatchSchedule,
    parseTimeToMinutes,
    formatMinutesToTime,
    OccupiedSlot,
    ScheduleMatchInput,
} from '@/lib/schedule/generateMatchSchedule'

export interface ScheduleActionResponse {
    success: boolean
    message: string
    scheduledCount?: number
    unscheduledCount?: number
    unscheduledMatchIds?: string[]
}

/**
 * Mengekstrak format jam "HH:mm" dari nilai string ISO timestamp atau string waktu.
 */
function extractHHmm(timeStr?: string | null): string {
    if (!timeStr) return ''
    if (timeStr.includes('T')) {
        const timePart = timeStr.split('T')[1]
        return timePart ? timePart.slice(0, 5) : ''
    }
    if (timeStr.includes(':')) {
        return timeStr.slice(0, 5)
    }
    return timeStr
}

/**
 * Server Action: Generate atau Regenerate Jadwal Pertandingan per Kategori & Babak
 * 
 * Aturan Bisnis (§4.8):
 * 1. Mendukung round IN ('group', 'semifinal', 'final', 'third_place').
 * 2. Ambil seluruh match round terkait di kategori terpilih.
 * 3. Ambil occupiedSlots dari SEMUA match (grup maupun knockout) dari SEMUA kategori
 *    yang sudah memiliki court_id/scheduled_time, agar tidak bentrok.
 * 4. Ambil konfigurasi court, jam operasional, dan durasi match dari tournament_settings.
 * 5. Panggil pure function generateMatchSchedule.
 * 6. Update court_id dan scheduled_time untuk match yang berhasil terjadwal.
 * 7. Jika ada match yang tidak muat, kembalikan warning dan rincian unscheduled tanpa error.
 * 8. Regenerate HANYA diizinkan jika belum ada match di babak kategori ini
 *    yang berstatus 'live' atau 'completed'.
 */
export async function generateCategoryScheduleAction(
    categoryIdOrTarget: string,
    roundParam?: 'group' | 'semifinal' | 'final' | 'third_place'
): Promise<ScheduleActionResponse> {
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

        // 2. Parse categoryId dan target round jika menggunakan format composite "categoryId:round"
        let categoryId = categoryIdOrTarget
        let round: 'group' | 'semifinal' | 'final' | 'third_place' = roundParam || 'group'

        if (categoryIdOrTarget.includes(':')) {
            const parts = categoryIdOrTarget.split(':')
            categoryId = parts[0]
            round = (parts[1] as 'group' | 'semifinal' | 'final' | 'third_place') || 'group'
        }

        // Validasi input dengan Zod schema
        const validation = generateScheduleSchema.safeParse({ categoryId, round })
        if (!validation.success) {
            return {
                success: false,
                message: validation.error.issues[0]?.message || 'Category ID tidak valid.',
            }
        }

        // 3. Ambil konfigurasi turnamen aktif
        const { data: settings, error: settingsError } = await supabase
            .from('tournament_settings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (settingsError || !settings) {
            return {
                success: false,
                message: 'Konfigurasi turnamen belum diatur. Silakan lakukan setup turnamen terlebih dahulu.',
            }
        }

        // 4. Ambil lapangan (courts) turnamen, sinkronisasi jika belum ada
        let { data: courts, error: courtsError } = await supabase
            .from('courts')
            .select('id, name')
            .eq('tournament_id', settings.id)
            .order('name', { ascending: true })

        if (courtsError) {
            return {
                success: false,
                message: `Gagal memuat data lapangan: ${courtsError.message}`,
            }
        }

        const requiredCourts = settings.number_of_courts || 1
        if (!courts || courts.length < requiredCourts) {
            const currentCount = courts?.length || 0
            const newCourtsToInsert = []
            for (let i = currentCount + 1; i <= requiredCourts; i++) {
                newCourtsToInsert.push({
                    tournament_id: settings.id,
                    name: `Court ${i}`,
                })
            }
            if (newCourtsToInsert.length > 0) {
                const { data: insertedCourts, error: insertCourtsErr } = await supabase
                    .from('courts')
                    .insert(newCourtsToInsert)
                    .select('id, name')

                if (insertCourtsErr) {
                    return {
                        success: false,
                        message: `Gagal membuat data lapangan: ${insertCourtsErr.message}`,
                    }
                }
                courts = [...(courts || []), ...(insertedCourts || [])]
            }
        }

        if (!courts || courts.length === 0) {
            return {
                success: false,
                message: 'Tidak ada lapangan aktif yang tersedia untuk turnamen ini.',
            }
        }

        // 5. Cek apakah ada match di babak kategori ini yang sedang 'live' atau 'completed'
        // Jika ada, kunci fitur regenerate sesuai aturan bisnis (§4.8 & §4.3)
        const { data: startedMatches, error: startedCheckError } = await supabase
            .from('matches')
            .select('id, status')
            .eq('category_id', categoryId)
            .eq('round', round)
            .in('status', ['live', 'completed'])

        if (startedCheckError) {
            return {
                success: false,
                message: `Gagal memeriksa status pertandingan: ${startedCheckError.message}`,
            }
        }

        if (startedMatches && startedMatches.length > 0) {
            return {
                success: false,
                message:
                    'Jadwal tidak dapat digenerate ulang karena sudah ada pertandingan yang berstatus live atau selesai.',
            }
        }

        // 6. Ambil semua match untuk round ini di kategori terpilih
        const { data: categoryMatches, error: matchesError } = await supabase
            .from('matches')
            .select('id, team_a_id, team_b_id')
            .eq('category_id', categoryId)
            .eq('round', round)

        if (matchesError) {
            return {
                success: false,
                message: `Gagal memuat data pertandingan: ${matchesError.message}`,
            }
        }

        if (!categoryMatches || categoryMatches.length === 0) {
            const roundLabels: Record<string, string> = {
                group: 'babak grup. Silakan jalankan Drawing Grup terlebih dahulu.',
                semifinal: 'babak semifinal. Silakan generate Bracket Semifinal terlebih dahulu.',
                final: 'babak final.',
                third_place: 'perebutan juara 3.',
            }
            return {
                success: false,
                message: `Belum ada pertandingan di ${roundLabels[round] || round}`,
            }
        }

        // 7. Ambil occupiedSlots dari SEMUA match (grup maupun knockout) dari SEMUA kategori
        // yang sudah memiliki court_id dan scheduled_time, KECUALI match (categoryId, round)
        // yang sedang dijadwalkan
        const { data: allScheduledMatches, error: occupiedError } = await supabase
            .from('matches')
            .select('court_id, scheduled_time, category_id, round')
            .not('court_id', 'is', null)
            .not('scheduled_time', 'is', null)

        if (occupiedError) {
            return {
                success: false,
                message: `Gagal memuat jadwal pertandingan lain: ${occupiedError.message}`,
            }
        }

        const occupiedSlots: OccupiedSlot[] = (allScheduledMatches || [])
            .filter((m) => !(m.category_id === categoryId && m.round === round))
            .filter((m) => m.court_id && m.scheduled_time)
            .map((m) => ({
                courtId: m.court_id!,
                scheduledTime: extractHHmm(m.scheduled_time!),
            }))

        // 8. Kosongkan terlebih dahulu court_id dan scheduled_time match pada babak ini
        // di kategori ini agar proses penjadwalan bersih dan idempoten
        const { error: resetError } = await supabase
            .from('matches')
            .update({
                court_id: null,
                scheduled_time: null,
                updated_at: new Date().toISOString(),
            })
            .eq('category_id', categoryId)
            .eq('round', round)

        if (resetError) {
            return {
                success: false,
                message: `Gagal mereset jadwal lama: ${resetError.message}`,
            }
        }

        // 9. Jalankan pure function generateMatchSchedule
        const matchesInput: ScheduleMatchInput[] = categoryMatches.map((m) => ({
            id: m.id,
            teamAId: m.team_a_id,
            teamBId: m.team_b_id,
        }))

        const courtIds = courts.map((c) => c.id)
        const startTime = settings.daily_start_time
            ? extractHHmm(settings.daily_start_time)
            : '08:00'
        const endTime = settings.daily_end_time
            ? extractHHmm(settings.daily_end_time)
            : '18:00'
        const durationMinutes = settings.match_duration_minutes || 45

        let reservedRoundsAtEnd: number | undefined = undefined
        let earliestStartTime: string | undefined = undefined
        let activeCatCountForKnockout = 0

        if (round === 'group') {
            // 1. Hitung reservedRoundsAtEnd untuk babak knockout secara otomatis:
            // 2 (semifinal) + 1 (final) + (1 jika third_place_enabled) per kategori
            // aktif yang groups-nya sudah ada
            const { data: activeCatsWithGroups } = await supabase
                .from('categories')
                .select('id, groups!inner(id)')
                .eq('is_active', true)

            activeCatCountForKnockout = new Set((activeCatsWithGroups || []).map((c) => c.id)).size
            if (activeCatCountForKnockout > 0) {
                const knockoutMatchesPerCat = 2 + 1 + (settings.third_place_enabled ? 1 : 0)
                const totalKnockoutMatches = activeCatCountForKnockout * knockoutMatchesPerCat
                const courtCount = courtIds.length || 1
                reservedRoundsAtEnd = Math.ceil(totalKnockoutMatches / courtCount)
            }
        } else {
            // 2. Jika round='semifinal' (atau 'final'/'third_place'):
            // Hitung earliestStartTime dari scheduled_time TERAKHIR match round='group'
            // di kategori yang sama + durationMinutes
            const { data: latestGroupMatch } = await supabase
                .from('matches')
                .select('scheduled_time')
                .eq('category_id', categoryId)
                .eq('round', 'group')
                .not('scheduled_time', 'is', null)
                .order('scheduled_time', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (latestGroupMatch?.scheduled_time) {
                const latestHHmm = extractHHmm(latestGroupMatch.scheduled_time)
                const latestMinutes = parseTimeToMinutes(latestHHmm)
                const earliestMinutes = latestMinutes + durationMinutes
                earliestStartTime = formatMinutesToTime(earliestMinutes)
            }
        }

        const scheduleResult = generateMatchSchedule(
            matchesInput,
            courtIds,
            startTime,
            endTime,
            durationMinutes,
            occupiedSlots,
            {
                reservedRoundsAtEnd,
                earliestStartTime,
            }
        )

        // 10. Update match yang berhasil terjadwal
        const todayDateStr = new Date().toISOString().split('T')[0]

        for (const item of scheduleResult.scheduled) {
            const scheduledTimestamp = `${todayDateStr}T${item.scheduledTime}:00.000Z`
            const { error: updateErr } = await supabase
                .from('matches')
                .update({
                    court_id: item.courtId,
                    scheduled_time: scheduledTimestamp,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', item.matchId)

            if (updateErr) {
                console.error(`Gagal mengupdate match ${item.matchId}:`, updateErr.message)
            }
        }

        // 11. Revalidasi cache rute admin
        revalidatePath('/admin/schedule')
        revalidatePath('/admin')

        const scheduledCount = scheduleResult.scheduled.length
        const unscheduledCount = scheduleResult.unscheduled.length
        const unscheduledMatchIds = scheduleResult.unscheduled.map((u) => u.matchId)

        if (unscheduledCount > 0) {
            const reservedWarningDetail =
                round === 'group' && reservedRoundsAtEnd && reservedRoundsAtEnd > 0
                    ? ` Hal ini kemungkinan disebabkan ${reservedRoundsAtEnd} ronde di akhir jadwal dicadangkan untuk babak knockout (${activeCatCountForKnockout} kategori). Solusi: tambah court di Setup Turnamen, perpanjang jam operasional, atau matikan sementara kategori yang belum perlu.`
                    : ''

            return {
                success: true,
                message: `${scheduledCount} pertandingan berhasil dijadwalkan, namun terdapat ${unscheduledCount} pertandingan yang tidak muat dalam jam operasional (${startTime} - ${endTime}).${reservedWarningDetail}`,
                scheduledCount,
                unscheduledCount,
                unscheduledMatchIds,
            }
        }

        return {
            success: true,
            message: `Seluruh ${scheduledCount} pertandingan berhasil dijadwalkan dengan sukses!`,
            scheduledCount,
            unscheduledCount: 0,
            unscheduledMatchIds: [],
        }
    } catch (err: unknown) {
        console.error('Unexpected Schedule Generation Error:', err)
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan sistem saat membuat jadwal.',
        }
    }
}

/**
 * Server Action: Generate Jadwal Seluruh Kategori Secara Paralel
 * 
 * Spesifikasi & Alur:
 * 1. Ambil SEMUA kategori aktif yang sudah memiliki groups (hasil draw).
 * 2. Ambil SEMUA match round='group' dari seluruh kategori tersebut.
 * 3. Guard: Cek apakah ada match yang berstatus 'live' atau 'completed'. Jika ada, tolak aksi ini.
 * 4. Set kembali court_id dan scheduled_time menjadi null untuk SEMUA match round='group'
 *    di SEMUA kategori (reset total).
 * 5. Panggil generateMatchSchedule() SATU KALI SAJA dengan gabungan SEMUA match dari semua
 *    kategori sekaligus, sehingga match dari kategori berbeda bisa terisi di court berbeda
 *    pada ronde/waktu yang sama (paralel).
 * 6. Simpan hasil scheduled ke database (court_id, scheduled_time).
 * 7. Tampilkan warning jika ada match yang unscheduled (tidak muat dalam jam operasional).
 */
export async function generateAllCategoriesScheduleAction(): Promise<ScheduleActionResponse> {
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

        // 2. Ambil konfigurasi turnamen aktif
        const { data: settings, error: settingsError } = await supabase
            .from('tournament_settings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (settingsError || !settings) {
            return {
                success: false,
                message: 'Konfigurasi turnamen belum diatur. Silakan lakukan setup turnamen terlebih dahulu.',
            }
        }

        // 3. Ambil lapangan (courts) turnamen, sinkronisasi jika belum ada
        let { data: courts, error: courtsError } = await supabase
            .from('courts')
            .select('id, name')
            .eq('tournament_id', settings.id)
            .order('name', { ascending: true })

        if (courtsError) {
            return {
                success: false,
                message: `Gagal memuat data lapangan: ${courtsError.message}`,
            }
        }

        const requiredCourts = settings.number_of_courts || 1
        if (!courts || courts.length < requiredCourts) {
            const currentCount = courts?.length || 0
            const newCourtsToInsert = []
            for (let i = currentCount + 1; i <= requiredCourts; i++) {
                newCourtsToInsert.push({
                    tournament_id: settings.id,
                    name: `Court ${i}`,
                })
            }
            if (newCourtsToInsert.length > 0) {
                const { data: insertedCourts, error: insertCourtsErr } = await supabase
                    .from('courts')
                    .insert(newCourtsToInsert)
                    .select('id, name')

                if (insertCourtsErr) {
                    return {
                        success: false,
                        message: `Gagal membuat data lapangan: ${insertCourtsErr.message}`,
                    }
                }
                courts = [...(courts || []), ...(insertedCourts || [])]
            }
        }

        if (!courts || courts.length === 0) {
            return {
                success: false,
                message: 'Tidak ada lapangan aktif yang tersedia untuk turnamen ini.',
            }
        }

        // 4. Ambil semua kategori yang sudah memiliki groups hasil drawing (termasuk yang nonaktif)
        const { data: categoriesWithGroups, error: catError } = await supabase
            .from('categories')
            .select('id, name, groups!inner(id)')

        if (catError) {
            return {
                success: false,
                message: `Gagal memuat kategori: ${catError.message}`,
            }
        }

        const categoryIds = Array.from(new Set((categoriesWithGroups || []).map((c) => c.id)))

        if (categoryIds.length === 0) {
            return {
                success: false,
                message: 'Belum ada kategori yang memiliki hasil drawing grup.',
            }
        }

        // 5. Cek apakah ada match di SEMUA kategori tersebut yang berstatus 'live' atau 'completed'
        const { data: startedMatches, error: startedCheckError } = await supabase
            .from('matches')
            .select('id, status, category_id')
            .in('category_id', categoryIds)
            .eq('round', 'group')
            .in('status', ['live', 'completed'])

        if (startedCheckError) {
            return {
                success: false,
                message: `Gagal memeriksa status pertandingan: ${startedCheckError.message}`,
            }
        }

        if (startedMatches && startedMatches.length > 0) {
            return {
                success: false,
                message:
                    'Jadwal tidak dapat digenerate ulang secara paralel karena sudah ada pertandingan yang berstatus live atau selesai.',
            }
        }

        // 6. Ambil semua match round='group' dari seluruh kategori aktif
        const { data: allMatches, error: matchesError } = await supabase
            .from('matches')
            .select('id, team_a_id, team_b_id, category_id')
            .in('category_id', categoryIds)
            .eq('round', 'group')

        if (matchesError) {
            return {
                success: false,
                message: `Gagal memuat data pertandingan: ${matchesError.message}`,
            }
        }

        if (!allMatches || allMatches.length === 0) {
            return {
                success: false,
                message:
                    'Belum ada pertandingan babak grup yang dapat dijadwalkan. Pastikan Drawing Grup sudah dilakukan.',
            }
        }

        // 7. Reset total: set court_id dan scheduled_time menjadi null untuk seluruh match group
        const { error: resetError } = await supabase
            .from('matches')
            .update({
                court_id: null,
                scheduled_time: null,
                updated_at: new Date().toISOString(),
            })
            .in('category_id', categoryIds)
            .eq('round', 'group')

        if (resetError) {
            return {
                success: false,
                message: `Gagal mereset jadwal: ${resetError.message}`,
            }
        }

        // 8. Panggil generateMatchSchedule SATU KALI SAJA dengan gabungan seluruh match
        // dari semua kategori
        const matchesInput: ScheduleMatchInput[] = allMatches.map((m) => ({
            id: m.id,
            teamAId: m.team_a_id,
            teamBId: m.team_b_id,
        }))

        const courtIds = courts.map((c) => c.id)
        const startTime = settings.daily_start_time
            ? extractHHmm(settings.daily_start_time)
            : '08:00'
        const endTime = settings.daily_end_time
            ? extractHHmm(settings.daily_end_time)
            : '18:00'
        const durationMinutes = settings.match_duration_minutes || 45

        const knockoutMatchesPerCat = 2 + 1 + (settings.third_place_enabled ? 1 : 0)
        const totalKnockoutMatches = categoryIds.length * knockoutMatchesPerCat
        const reservedRoundsAtEnd = Math.ceil(totalKnockoutMatches / courtIds.length)

        // occupiedSlots kosong karena seluruh match dari semua kategori dijadwalkan
        // secara paralel bersamaan
        const scheduleResult = generateMatchSchedule(
            matchesInput,
            courtIds,
            startTime,
            endTime,
            durationMinutes,
            [],
            {
                reservedRoundsAtEnd,
            }
        )

        // 9. Update match yang berhasil terjadwal
        const todayDateStr = new Date().toISOString().split('T')[0]

        for (const item of scheduleResult.scheduled) {
            const scheduledTimestamp = `${todayDateStr}T${item.scheduledTime}:00.000Z`
            const { error: updateErr } = await supabase
                .from('matches')
                .update({
                    court_id: item.courtId,
                    scheduled_time: scheduledTimestamp,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', item.matchId)

            if (updateErr) {
                console.error(`Gagal mengupdate match ${item.matchId}:`, updateErr.message)
            }
        }

        // 10. Revalidasi cache rute
        revalidatePath('/admin/schedule')
        revalidatePath('/admin')

        const scheduledCount = scheduleResult.scheduled.length
        const unscheduledCount = scheduleResult.unscheduled.length
        const unscheduledMatchIds = scheduleResult.unscheduled.map((u) => u.matchId)

        if (unscheduledCount > 0) {
            const reservedWarningDetail =
                reservedRoundsAtEnd > 0
                    ? ` Hal ini kemungkinan disebabkan ${reservedRoundsAtEnd} ronde di akhir jadwal dicadangkan untuk babak knockout (${categoryIds.length} kategori). Solusi: tambah court di Setup Turnamen, perpanjang jam operasional, atau matikan sementara kategori yang belum perlu.`
                    : ''

            return {
                success: true,
                message: `${scheduledCount} pertandingan dari ${categoryIds.length} kategori berhasil dijadwalkan secara paralel, namun terdapat ${unscheduledCount} pertandingan yang tidak muat dalam jam operasional (${startTime} - ${endTime}).${reservedWarningDetail}`,
                scheduledCount,
                unscheduledCount,
                unscheduledMatchIds,
            }
        }

        return {
            success: true,
            message: `Seluruh ${scheduledCount} pertandingan dari ${categoryIds.length} kategori berhasil dijadwalkan secara paralel!`,
            scheduledCount,
            unscheduledCount: 0,
            unscheduledMatchIds: [],
        }
    } catch (err: unknown) {
        console.error('Unexpected All-Categories Schedule Generation Error:', err)
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan sistem saat membuat jadwal paralel.',
        }
    }
}

/**
 * Server Action: Reset Semua Jadwal Pertandingan Babak Grup
 * 
 * Aturan Bisnis & Pengaman:
 * 1. Verifikasi autentikasi admin.
 * 2. Cek apakah ada match manapun di babak grup (round='group') di SEMUA kategori
 *    yang berstatus 'live' atau 'completed'.
 * 3. Jika ada match 'live' atau 'completed', TOLAK aksi ini dengan pesan jelas.
 * 4. Jika aman, set court_id = null dan scheduled_time = null untuk SEMUA match round='group'.
 * 5. Revalidate path /admin/schedule dan /admin.
 */
export async function resetAllGroupSchedulesAction(): Promise<ScheduleActionResponse> {
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

        // 2. Cek apakah ada match round='group' di SEMUA kategori yang berstatus
        // 'live' atau 'completed'
        const { data: startedMatches, error: startedCheckError } = await supabase
            .from('matches')
            .select('id, status')
            .eq('round', 'group')
            .in('status', ['live', 'completed'])

        if (startedCheckError) {
            return {
                success: false,
                message: `Gagal memeriksa status pertandingan: ${startedCheckError.message}`,
            }
        }

        if (startedMatches && startedMatches.length > 0) {
            return {
                success: false,
                message:
                    'Jadwal tidak dapat direset karena terdapat pertandingan babak grup yang berstatus live atau selesai.',
            }
        }

        // 3. Reset seluruh match babak grup di semua kategori
        const { error: resetError } = await supabase
            .from('matches')
            .update({
                court_id: null,
                scheduled_time: null,
                updated_at: new Date().toISOString(),
            })
            .eq('round', 'group')

        if (resetError) {
            return {
                success: false,
                message: `Gagal mereset seluruh jadwal: ${resetError.message}`,
            }
        }

        // 4. Revalidasi cache
        revalidatePath('/admin/schedule')
        revalidatePath('/admin')

        return {
            success: true,
            message: 'Seluruh jadwal pertandingan babak grup berhasil direset.',
        }
    } catch (err: unknown) {
        console.error('Unexpected Reset All Schedules Error:', err)
        return {
            success: false,
            message:
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan sistem saat mereset seluruh jadwal.',
        }
    }
}
