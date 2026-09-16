'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
    checkGroupStageComplete,
    generateBracketPairing,
    checkSemifinalComplete,
    generateFinalPairing,
} from '@/lib/bracket'
import { sortGroupStandings } from '@/lib/scoring'
import type { Match, Team, StandingRow } from '@/types/domain'

export interface BracketActionResponse {
    success: boolean
    message: string
}

/**
 * Server Action: Generate Pasangan Bracket Babak Semifinal
 *
 * Aturan Bisnis (§4.7 & §6.2):
 * 1. Ambil data grup pada kategori terpilih.
 * 2. Cek apakah fase grup sudah selesai (checkGroupStageComplete).
 * 3. HANYA mendukung kasus 2 grup (Juara A vs Runner-up B, Juara B vs Runner-up A).
 * 4. Ambil standings dari VIEW 'standings' di Supabase.
 * 5. Panggil generateBracketPairing.
 * 6. Insert ke tabel matches dengan round='semifinal', group_id=NULL, status='scheduled'.
 */
export async function generateBracketAction(
    categoryId: string
): Promise<BracketActionResponse> {
    try {
        if (!categoryId) {
            return {
                success: false,
                message: 'ID Kategori turnamen tidak valid.',
            }
        }

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

        const email = user.email?.toLowerCase().trim() || ''
        const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('email', email)
            .maybeSingle()

        if (!adminUser || adminUser.role !== 'admin') {
            return {
                success: false,
                message: 'Akses ditolak. Anda tidak memiliki kewenangan administrator.',
            }
        }

        // 2. Ambil grup pada kategori ini
        const { data: groupsData, error: groupsError } = await supabase
            .from('groups')
            .select('id, name')
            .eq('category_id', categoryId)
            .order('name', { ascending: true })

        if (groupsError) {
            return {
                success: false,
                message: `Gagal mengambil data grup: ${groupsError.message}`,
            }
        }

        const groups = groupsData || []
        if (groups.length !== 2) {
            return {
                success: false,
                message: `Pairing untuk ${groups.length} grup belum didukung`,
            }
        }

        // 3. Ambil seluruh match babak grup
        const { data: groupMatchesData, error: matchesError } = await supabase
            .from('matches')
            .select('id, round, status, group_id, team_a_id, team_b_id, winner_team_id')
            .eq('category_id', categoryId)
            .eq('round', 'group')

        if (matchesError) {
            return {
                success: false,
                message: `Gagal mengambil pertandingan fase grup: ${matchesError.message}`,
            }
        }

        const groupMatches = (groupMatchesData as unknown as Match[]) || []
        const isComplete = checkGroupStageComplete(groupMatches)

        if (!isComplete) {
            const remaining = groupMatches.filter((m) => m.status !== 'completed').length
            return {
                success: false,
                message: `Fase grup belum selesai, ${remaining} dari ${groupMatches.length} match masih berjalan.`,
            }
        }

        // 4. Cek apakah semifinal sudah pernah dibuat dan apakah sudah ada match yang jalan
        const { data: existingSemifinals, error: existingError } = await supabase
            .from('matches')
            .select('id, status')
            .eq('category_id', categoryId)
            .eq('round', 'semifinal')

        if (existingError) {
            return {
                success: false,
                message: `Gagal memeriksa match semifinal: ${existingError.message}`,
            }
        }

        const hasStarted = (existingSemifinals || []).some(
            (m) => m.status === 'live' || m.status === 'completed'
        )

        if (hasStarted) {
            return {
                success: false,
                message: 'Pertandingan semifinal sudah dimulai atau selesai. Bracket tidak dapat di-generate ulang.',
            }
        }

        // Jika sudah ada semifinal yang masih scheduled, hapus dulu untuk re-generate
        if (existingSemifinals && existingSemifinals.length > 0) {
            const { error: deleteError } = await supabase
                .from('matches')
                .delete()
                .eq('category_id', categoryId)
                .eq('round', 'semifinal')

            if (deleteError) {
                return {
                    success: false,
                    message: `Gagal menghapus bracket lama: ${deleteError.message}`,
                }
            }
        }

        // 5. Ambil data standings dari VIEW 'standings'
        const groupIds = groups.map((g) => g.id)
        const { data: standingsData, error: standingsError } = await supabase
            .from('standings')
            .select('*')
            .in('group_id', groupIds)

        if (standingsError) {
            return {
                success: false,
                message: `Gagal mengambil data klasemen: ${standingsError.message}`,
            }
        }

        // Ambil data tim untuk pasangan nama pemain
        const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .select('id, player1_name, player2_name')
            .eq('category_id', categoryId)

        if (teamsError) {
            return {
                success: false,
                message: `Gagal mengambil data tim: ${teamsError.message}`,
            }
        }

        const teamsMap: Record<string, Team> = {}
        for (const t of (teamsData as unknown as Team[]) || []) {
            teamsMap[t.id] = t
        }

        const completedMatches = groupMatches.filter((m) => m.status === 'completed')

        // Proses urutan ranking per grup
        const groupAStandingsRows = ((standingsData as unknown as StandingRow[]) || [])
            .filter((r) => r.group_id === groups[0].id)
            .map((r) => ({ ...r, team: teamsMap[r.team_id] || null, group: groups[0] }))

        const groupBStandingsRows = ((standingsData as unknown as StandingRow[]) || [])
            .filter((r) => r.group_id === groups[1].id)
            .map((r) => ({ ...r, team: teamsMap[r.team_id] || null, group: groups[1] }))

        const sortedGroupA = sortGroupStandings(
            groupAStandingsRows,
            completedMatches.filter((m) => m.group_id === groups[0].id)
        ).standings

        const sortedGroupB = sortGroupStandings(
            groupBStandingsRows,
            completedMatches.filter((m) => m.group_id === groups[1].id)
        ).standings

        if (sortedGroupA.length < 2 || sortedGroupB.length < 2) {
            return {
                success: false,
                message: 'Data klasemen belum mencukupi untuk menentukan juara dan runner-up tiap grup.',
            }
        }

        // 6. Panggil pure function generateBracketPairing
        const pairings = generateBracketPairing([
            {
                group: groups[0],
                winner: sortedGroupA[0].team,
                runnerUp: sortedGroupA[1].team,
            },
            {
                group: groups[1],
                winner: sortedGroupB[0].team,
                runnerUp: sortedGroupB[1].team,
            },
        ])

        // 7. Insert ke tabel matches (round='semifinal')
        const matchesPayload = pairings.map((p) => ({
            category_id: categoryId,
            round: 'semifinal' as const,
            team_a_id: (p.team_a as Team).id,
            team_b_id: (p.team_b as Team).id,
            group_id: null,
            status: 'scheduled' as const,
            court_id: null,
            scheduled_time: null,
            games_team_a: 0,
            games_team_b: 0,
            current_point_a: '0',
            current_point_b: '0',
        }))

        const { error: insertError } = await supabase
            .from('matches')
            .insert(matchesPayload)

        if (insertError) {
            return {
                success: false,
                message: `Gagal membuat pertandingan semifinal: ${insertError.message}`,
            }
        }

        revalidatePath('/admin/bracket')
        revalidatePath(`/display/bracket/${categoryId}`)

        return {
            success: true,
            message: 'Bracket babak semifinal berhasil di-generate!',
        }
    } catch (err: unknown) {
        console.error('generateBracketAction error:', err)
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat membuat bracket.',
        }
    }
}

/**
 * Server Action: Reset Bracket Semifinal
 * HANYA diizinkan jika pertandingan semifinal belum ada yang 'live' atau 'completed'.
 */
export async function resetBracketAction(
    categoryId: string
): Promise<BracketActionResponse> {
    try {
        if (!categoryId) {
            return { success: false, message: 'ID Kategori tidak valid.' }
        }

        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, message: 'Akses ditolak.' }
        }

        // Cek status semifinal
        const { data: semifinalMatches } = await supabase
            .from('matches')
            .select('id, status')
            .eq('category_id', categoryId)
            .eq('round', 'semifinal')

        if (!semifinalMatches || semifinalMatches.length === 0) {
            return { success: false, message: 'Belum ada bracket semifinal untuk kategori ini.' }
        }

        const hasStarted = semifinalMatches.some(
            (m) => m.status === 'live' || m.status === 'completed'
        )

        if (hasStarted) {
            return {
                success: false,
                message: 'Pertandingan semifinal sudah dimulai atau selesai. Bracket tidak dapat di-reset.',
            }
        }

        // Pastikan juga jika ada final/third_place yang masih scheduled, ikut terhapus
        const { data: finalMatches } = await supabase
            .from('matches')
            .select('id, status')
            .eq('category_id', categoryId)
            .in('round', ['final', 'third_place'])

        const hasFinalStarted = (finalMatches || []).some(
            (m) => m.status === 'live' || m.status === 'completed'
        )

        if (hasFinalStarted) {
            return {
                success: false,
                message: 'Pertandingan final atau perebutan juara 3 sudah dimulai/selesai. Reset semifinal tidak diizinkan.',
            }
        }

        const { error: deleteError } = await supabase
            .from('matches')
            .delete()
            .eq('category_id', categoryId)
            .in('round', ['semifinal', 'final', 'third_place'])

        if (deleteError) {
            return { success: false, message: deleteError.message }
        }

        revalidatePath('/admin/bracket')
        revalidatePath(`/display/bracket/${categoryId}`)

        return {
            success: true,
            message: 'Bracket semifinal berhasil di-reset.',
        }
    } catch (err: unknown) {
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Gagal mereset bracket.',
        }
    }
}

/**
 * Server Action: Generate Pasangan Babak Final & Perebutan Juara 3
 *
 * Sesuai docs/business-rules.md §4.7 & Flow Admin Bracket:
 * 1. Ambil kedua match semifinal kategori ini.
 * 2. Cek apakah kedua semifinal sudah berstatus 'completed' (checkSemifinalComplete).
 * 3. Proteksi regenerate: hanya diizinkan jika belum ada match final/third_place yang berstatus 'live' atau 'completed'.
 * 4. Ambil third_place_enabled dari tournament_settings.
 * 5. Panggil pure function generateFinalPairing.
 * 6. Insert ke tabel matches:
 *    - round='final': category_id, team_a_id, team_b_id, group_id=NULL, status='scheduled', court_id=NULL, scheduled_time=NULL.
 *    - JIKA third_place_enabled: round='third_place' dengan pola yang sama.
 */
export async function generateFinalAction(
    categoryId: string
): Promise<BracketActionResponse> {
    try {
        if (!categoryId) {
            return {
                success: false,
                message: 'ID Kategori turnamen tidak valid.',
            }
        }

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

        const email = user.email?.toLowerCase().trim() || ''
        const { data: adminUser } = await supabase
            .from('admin_users')
            .select('role')
            .eq('email', email)
            .maybeSingle()

        if (!adminUser || adminUser.role !== 'admin') {
            return {
                success: false,
                message: 'Akses ditolak. Anda tidak memiliki kewenangan administrator.',
            }
        }

        // 2. Ambil kedua match semifinal kategori ini
        const { data: semifinalMatchesData, error: sfError } = await supabase
            .from('matches')
            .select('id, round, status, team_a_id, team_b_id, winner_team_id')
            .eq('category_id', categoryId)
            .eq('round', 'semifinal')
            .order('created_at', { ascending: true })

        if (sfError) {
            return {
                success: false,
                message: `Gagal mengambil pertandingan semifinal: ${sfError.message}`,
            }
        }

        const semifinalMatches = semifinalMatchesData || []

        // 3. Cek status: apakah kedua semifinal sudah completed
        if (!checkSemifinalComplete(semifinalMatches)) {
            const completedCount = semifinalMatches.filter((m) => m.status === 'completed').length
            return {
                success: false,
                message: `Babak semifinal belum selesai (${completedCount} dari ${semifinalMatches.length} match selesai). Kedua match semifinal harus tuntas terlebih dahulu.`,
            }
        }

        // 4. Proteksi regenerate: hanya diizinkan jika belum ada match final/third_place yang berstatus 'live' atau 'completed'
        const { data: existingFinalMatches, error: existingFinalError } = await supabase
            .from('matches')
            .select('id, round, status')
            .eq('category_id', categoryId)
            .in('round', ['final', 'third_place'])

        if (existingFinalError) {
            return {
                success: false,
                message: `Gagal memeriksa pertandingan babak final: ${existingFinalError.message}`,
            }
        }

        const hasStarted = (existingFinalMatches || []).some(
            (m) => m.status === 'live' || m.status === 'completed'
        )

        if (hasStarted) {
            return {
                success: false,
                message: 'Pertandingan final atau perebutan juara 3 sudah dimulai atau selesai. Bracket final tidak dapat di-generate ulang.',
            }
        }

        // Hapus match final/third_place lama yang masih scheduled jika ada
        if (existingFinalMatches && existingFinalMatches.length > 0) {
            const { error: deleteError } = await supabase
                .from('matches')
                .delete()
                .eq('category_id', categoryId)
                .in('round', ['final', 'third_place'])

            if (deleteError) {
                return {
                    success: false,
                    message: `Gagal menghapus bracket final sebelumnya: ${deleteError.message}`,
                }
            }
        }

        // 5. Ambil third_place_enabled dari tournament_settings
        const { data: tournamentSettings, error: settingsError } = await supabase
            .from('tournament_settings')
            .select('third_place_enabled')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (settingsError) {
            return {
                success: false,
                message: `Gagal membaca pengaturan turnamen: ${settingsError.message}`,
            }
        }

        const thirdPlaceEnabled = tournamentSettings?.third_place_enabled ?? false

        // 6. Panggil pure function generateFinalPairing
        const pairingResult = generateFinalPairing(semifinalMatches, thirdPlaceEnabled)

        // 7. Insert ke tabel matches
        const matchesPayload: Array<{
            category_id: string
            round: 'final' | 'third_place'
            team_a_id: string
            team_b_id: string
            group_id: null
            status: 'scheduled'
            court_id: null
            scheduled_time: null
            games_team_a: number
            games_team_b: number
            current_point_a: string
            current_point_b: string
        }> = [
            {
                category_id: categoryId,
                round: 'final',
                team_a_id: pairingResult.final.teamAId,
                team_b_id: pairingResult.final.teamBId,
                group_id: null,
                status: 'scheduled',
                court_id: null,
                scheduled_time: null,
                games_team_a: 0,
                games_team_b: 0,
                current_point_a: '0',
                current_point_b: '0',
            },
        ]

        if (thirdPlaceEnabled && pairingResult.thirdPlace) {
            matchesPayload.push({
                category_id: categoryId,
                round: 'third_place',
                team_a_id: pairingResult.thirdPlace.teamAId,
                team_b_id: pairingResult.thirdPlace.teamBId,
                group_id: null,
                status: 'scheduled',
                court_id: null,
                scheduled_time: null,
                games_team_a: 0,
                games_team_b: 0,
                current_point_a: '0',
                current_point_b: '0',
            })
        }

        const { error: insertError } = await supabase
            .from('matches')
            .insert(matchesPayload)

        if (insertError) {
            return {
                success: false,
                message: `Gagal membuat pertandingan final: ${insertError.message}`,
            }
        }

        revalidatePath('/admin/bracket')
        revalidatePath(`/display/bracket/${categoryId}`)

        return {
            success: true,
            message: thirdPlaceEnabled
                ? 'Bracket Babak Final & Perebutan Juara 3 berhasil di-generate!'
                : 'Bracket Babak Final berhasil di-generate!',
        }
    } catch (err: unknown) {
        console.error('generateFinalAction error:', err)
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat membuat bracket final.',
        }
    }
}

/**
 * Server Action: Reset Bracket Babak Final & Perebutan Juara 3
 */
export async function resetFinalAction(
    categoryId: string
): Promise<BracketActionResponse> {
    try {
        if (!categoryId) {
            return { success: false, message: 'ID Kategori tidak valid.' }
        }

        const supabase = await createClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, message: 'Akses ditolak.' }
        }

        const { data: finalMatches } = await supabase
            .from('matches')
            .select('id, status')
            .eq('category_id', categoryId)
            .in('round', ['final', 'third_place'])

        if (!finalMatches || finalMatches.length === 0) {
            return { success: false, message: 'Belum ada bracket final untuk kategori ini.' }
        }

        const hasStarted = finalMatches.some(
            (m) => m.status === 'live' || m.status === 'completed'
        )

        if (hasStarted) {
            return {
                success: false,
                message: 'Pertandingan final atau perebutan juara 3 sudah dimulai atau selesai. Bracket tidak dapat di-reset.',
            }
        }

        const { error: deleteError } = await supabase
            .from('matches')
            .delete()
            .eq('category_id', categoryId)
            .in('round', ['final', 'third_place'])

        if (deleteError) {
            return { success: false, message: deleteError.message }
        }

        revalidatePath('/admin/bracket')
        revalidatePath(`/display/bracket/${categoryId}`)

        return {
            success: true,
            message: 'Bracket final berhasil di-reset.',
        }
    } catch (err: unknown) {
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Gagal mereset bracket final.',
        }
    }
}

