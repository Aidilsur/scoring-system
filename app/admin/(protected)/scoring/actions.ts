'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
    recordPoint,
    recordTiebreakPoint,
    checkMatchWinner,
    shouldStartTiebreakGame,
    type MatchTeam,
    type RegularPoint,
    SESSION_LOCK_TTL_MS,
} from '@/lib/scoring'
import type { Match, MatchRound, MatchStatus } from '@/types/domain'

export interface ScoringActionResponse {
    success: boolean
    message: string
    data?: Match
}

export interface SessionClaimResponse {
    success: boolean
    isOwner: boolean
    message: string
    activeSessionId?: string | null
    claimedAt?: string | null
}

/**
 * Server Action: Mengklaim atau memperbarui sesi scoring wasit pada suatu match.
 * Jika match sudah diklaim device lain dan claimed_at masih dalam 5 menit terakhir,
 * permintaan ditolak (isOwner: false) dan device lain masuk mode read-only.
 */
export async function claimScorerSessionAction(
    matchId: string,
    clientSessionId: string
): Promise<SessionClaimResponse> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase) {
            return { success: false, isOwner: false, message: auth.error || 'Akses ditolak.' }
        }
        const supabase = auth.supabase

        if (!clientSessionId) {
            return { success: false, isOwner: false, message: 'Session ID device tidak valid.' }
        }

        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('id, active_scorer_session_id, active_scorer_claimed_at')
            .eq('id', matchId)
            .single()

        if (matchError || !match) {
            return { success: false, isOwner: false, message: 'Pertandingan tidak ditemukan.' }
        }

        const now = Date.now()
        const claimedAtTime = match.active_scorer_claimed_at ? new Date(match.active_scorer_claimed_at).getTime() : 0
        const isExpired = !match.active_scorer_claimed_at || (now - claimedAtTime > SESSION_LOCK_TTL_MS)
        const isCurrentOwner = match.active_scorer_session_id === clientSessionId

        // Jika sudah diklaim device lain dan belum kedaluwarsa (<= 5 menit)
        if (match.active_scorer_session_id && !isCurrentOwner && !isExpired) {
            return {
                success: false,
                isOwner: false,
                message: 'Match ini sedang di-score oleh device lain',
                activeSessionId: match.active_scorer_session_id,
                claimedAt: match.active_scorer_claimed_at,
            }
        }

        // Boleh diklaim secara atomik:
        // - jika active_scorer_session_id masih null
        // - ATAU active_scorer_claimed_at sudah lebih dari 2 menit lalu (SESSION_LOCK_TTL_MS)
        // - ATAU device pemilik (renewal / heartbeat)
        const claimedAtIso = new Date().toISOString()
        const lockExpiryThresholdIso = new Date(now - SESSION_LOCK_TTL_MS).toISOString()

        const { data: updatedMatch, error: updateError } = await supabase
            .from('matches')
            .update({
                active_scorer_session_id: clientSessionId,
                active_scorer_claimed_at: claimedAtIso,
            })
            .eq('id', matchId)
            .or(`active_scorer_session_id.is.null,active_scorer_claimed_at.lt.${lockExpiryThresholdIso},active_scorer_session_id.eq.${clientSessionId}`)
            .select('id, active_scorer_session_id, active_scorer_claimed_at')
            .maybeSingle()

        if (updateError || !updatedMatch) {
            // Jika row gagal di-update karena race condition (baru diklaim device lain)
            return {
                success: false,
                isOwner: false,
                message: 'Match ini sedang di-score oleh device lain',
                activeSessionId: match.active_scorer_session_id,
                claimedAt: match.active_scorer_claimed_at,
            }
        }

        return {
            success: true,
            isOwner: true,
            message: 'Sesi scoring aktif.',
            activeSessionId: clientSessionId,
            claimedAt: claimedAtIso,
        }
    } catch (err: unknown) {
        console.error('Claim Session Error:', err)
        return {
            success: false,
            isOwner: false,
            message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mengklaim sesi.',
        }
    }
}

/**
 * Server Action: Heartbeat berkala (setiap 30 detik saat tab browser visible).
 * Memperpanjang active_scorer_claimed_at menjadi waktu sekarang HANYA jika
 * active_scorer_session_id masih cocok dengan clientSessionId.
 */
export async function heartbeatScorerSessionAction(
    matchId: string,
    clientSessionId: string
): Promise<{ success: boolean; isOwner: boolean }> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase) {
            return { success: false, isOwner: false }
        }
        const supabase = auth.supabase

        if (!clientSessionId || !matchId) {
            return { success: false, isOwner: false }
        }

        const claimedAtIso = new Date().toISOString()
        const { data, error } = await supabase
            .from('matches')
            .update({
                active_scorer_claimed_at: claimedAtIso,
            })
            .eq('id', matchId)
            .eq('active_scorer_session_id', clientSessionId)
            .select('id')
            .maybeSingle()

        if (error || !data) {
            return { success: false, isOwner: false }
        }

        return { success: true, isOwner: true }
    } catch {
        return { success: false, isOwner: false }
    }
}

/**
 * Server Action: Melepas kendali scoring (Tombol Lepas Kendali atau saat navigasi keluar).
 * Mengosongkan active_scorer_session_id dan active_scorer_claimed_at menjadi NULL
 * jika session ID cocok dengan device pemegang klaim saat ini.
 */
export async function releaseScorerSessionAction(
    matchId: string,
    clientSessionId: string
): Promise<{ success: boolean; message: string }> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase) {
            return { success: false, message: auth.error || 'Akses ditolak.' }
        }
        const supabase = auth.supabase

        if (!clientSessionId || !matchId) {
            return { success: false, message: 'ID match atau session tidak valid.' }
        }

        const { data, error } = await supabase
            .from('matches')
            .update({
                active_scorer_session_id: null,
                active_scorer_claimed_at: null,
            })
            .eq('id', matchId)
            .eq('active_scorer_session_id', clientSessionId)
            .select('id, court_id')
            .maybeSingle()

        if (error) {
            console.error('Failed to release scorer session:', error)
            return { success: false, message: 'Gagal melepas kendali scoring.' }
        }

        if (data?.court_id) {
            revalidatePath(`/display/court/${data.court_id}`)
        }
        revalidatePath('/admin/scoring')

        return { success: true, message: 'Kendali scoring berhasil dilepas.' }
    } catch (err: unknown) {
        console.error('Release Scorer Session Error:', err)
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat melepas kendali.',
        }
    }
}

/**
 * Verifikasi autentikasi user (Admin atau Referee)
 */
async function verifyScorerAuth() {
    const supabase = await createClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { authorized: false, error: 'Akses ditolak. Silakan login terlebih dahulu.' }
    }

    const email = user.email?.toLowerCase().trim() || ''
    const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', email)
        .maybeSingle()

    if (!adminUser || !['admin', 'referee'].includes(adminUser.role)) {
        return { authorized: false, error: 'Akses ditolak. Anda tidak memiliki wewenang wasit atau admin.' }
    }

    return { authorized: true, user, supabase }
}

/**
 * Server Action: Mencatat penambahan poin pada pertandingan
 * 1. Ambil match & setting golden_point
 * 2. Cek compare-and-swap concurrency lock session
 * 3. Simpan snapshot kondisi sebelum diubah ke match_score_history
 * 4. Tentukan mode tiebreak / regular dan hitung progres poin
 * 5. Jika game selesai: tambah game, cek pemenang match (selesai jika tercapai target)
 * 6. Ubah status 'scheduled' menjadi 'live'
 * 7. Update database matches
 */
export async function recordPointAction(
    matchId: string,
    winningTeam: MatchTeam,
    clientSessionId?: string
): Promise<ScoringActionResponse> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase) {
            return { success: false, message: auth.error || 'Akses ditolak.' }
        }
        const supabase = auth.supabase

        // 1. Ambil match saat ini dari database
        const { data: currentMatch, error: matchError } = await supabase
            .from('matches')
            .select(`
                id,
                category_id,
                group_id,
                round,
                team_a_id,
                team_b_id,
                court_id,
                status,
                winner_team_id,
                games_team_a,
                games_team_b,
                current_point_a,
                current_point_b,
                scheduled_time,
                completed_at,
                active_scorer_session_id,
                active_scorer_claimed_at
            `)
            .eq('id', matchId)
            .single()

        if (matchError || !currentMatch) {
            return { success: false, message: 'Pertandingan tidak ditemukan.' }
        }

        if (currentMatch.status === 'completed') {
            return { success: false, message: 'Pertandingan sudah selesai. Gunakan Undo jika ingin mengubah poin.' }
        }

        if (!clientSessionId) {
            return {
                success: false,
                message: 'Akses ditolak: Device session ID tidak valid atau tidak ditemukan.',
            }
        }

        // Compare-and-swap: verifikasi active_scorer_session_id di database masih sama dengan session ID milik device yang melakukan request
        const now = Date.now()
        const claimedAtTime = currentMatch.active_scorer_claimed_at
            ? new Date(currentMatch.active_scorer_claimed_at).getTime()
            : 0
        const isClaimExpired = !currentMatch.active_scorer_claimed_at || (now - claimedAtTime > SESSION_LOCK_TTL_MS)

        if (
            currentMatch.active_scorer_session_id &&
            currentMatch.active_scorer_session_id !== clientSessionId &&
            !isClaimExpired
        ) {
            return {
                success: false,
                message: 'Akses ditolak: Match ini sedang di-score oleh device lain. Sesi Anda tidak valid atau telah diambil alih.',
            }
        }

        // Cek apakah ada match LAIN di court yang sama yang sedang live (mencegah 2 match live bersamaan di court fisik sama)
        if (currentMatch.court_id) {
            const { data: conflictingLiveMatches } = await supabase
                .from('matches')
                .select(`
                    id,
                    team_a:teams!matches_team_a_id_fkey(player1_name, player2_name),
                    team_b:teams!matches_team_b_id_fkey(player1_name, player2_name)
                `)
                .eq('court_id', currentMatch.court_id)
                .eq('status', 'live')
                .neq('id', currentMatch.id)
                .limit(1)

            if (conflictingLiveMatches && conflictingLiveMatches.length > 0) {
                const liveM = conflictingLiveMatches[0]
                const teamAData = (Array.isArray(liveM.team_a) ? liveM.team_a[0] : liveM.team_a) as { player1_name?: string; player2_name?: string } | null
                const teamBData = (Array.isArray(liveM.team_b) ? liveM.team_b[0] : liveM.team_b) as { player1_name?: string; player2_name?: string } | null
                const teamA = `${teamAData?.player1_name || 'Tim A'}/${teamAData?.player2_name || ''}`.trim()
                const teamB = `${teamBData?.player1_name || 'Tim B'}/${teamBData?.player2_name || ''}`.trim()
                return {
                    success: false,
                    message: `Court ini masih memiliki pertandingan yang sedang berlangsung (${teamA} vs ${teamB}). Selesaikan atau tandai match tersebut terlebih dahulu sebelum memulai match baru.`,
                }
            }
        }

        // Ambil pengaturan golden point dari tournament_settings
        const { data: settings } = await supabase
            .from('tournament_settings')
            .select('golden_point_enabled')
            .limit(1)
            .maybeSingle()

        const goldenPointEnabled = settings?.golden_point_enabled ?? true

        // 2. SIMPAN SNAPSHOT kondisi SEBELUM diubah ke match_score_history
        const { error: historyError } = await supabase
            .from('match_score_history')
            .insert({
                match_id: currentMatch.id,
                point_a: currentMatch.current_point_a ?? '0',
                point_b: currentMatch.current_point_b ?? '0',
                games_team_a: currentMatch.games_team_a,
                games_team_b: currentMatch.games_team_b,
                status: currentMatch.status,
                winner_team_id: currentMatch.winner_team_id,
            })

        if (historyError) {
            console.error('Failed to save score history snapshot:', historyError)
            // Lanjutkan jika history table belum ada di remote, tapi log error
        }

        // 3. Tentukan mode: tiebreak / golden game atau regular game
        const round = currentMatch.round as MatchRound
        const isTiebreak = shouldStartTiebreakGame(
            currentMatch.games_team_a,
            currentMatch.games_team_b,
            round
        )

        let finalPointA: string = '0'
        let finalPointB: string = '0'
        let finalGamesA: number = currentMatch.games_team_a
        let finalGamesB: number = currentMatch.games_team_b
        let finalStatus: MatchStatus = currentMatch.status as MatchStatus
        let finalWinnerId: string | null = currentMatch.winner_team_id
        let finalCompletedAt: string | null = currentMatch.completed_at

        if (isTiebreak) {
            // Tiebreak / Golden Game logic
            const requireWinBy2 = round === 'group'
            const currentPointANum = parseInt(currentMatch.current_point_a || '0', 10) || 0
            const currentPointBNum = parseInt(currentMatch.current_point_b || '0', 10) || 0

            const tiebreakResult = recordTiebreakPoint(
                { pointA: currentPointANum, pointB: currentPointBNum },
                winningTeam,
                requireWinBy2
            )

            if (tiebreakResult.isGameWon) {
                // Game tiebreak selesai
                if (tiebreakResult.winner === 'team_a') {
                    finalGamesA += 1
                } else {
                    finalGamesB += 1
                }
                finalPointA = '0'
                finalPointB = '0'

                // Cek pemenang match
                const matchWinner = checkMatchWinner(finalGamesA, finalGamesB, round)
                if (matchWinner) {
                    finalStatus = 'completed'
                    finalWinnerId = matchWinner === 'team_a' ? currentMatch.team_a_id : currentMatch.team_b_id
                    finalCompletedAt = new Date().toISOString()
                }
            } else {
                finalPointA = tiebreakResult.pointA.toString()
                finalPointB = tiebreakResult.pointB.toString()
            }
        } else {
            // Regular Game logic
            const regularResult = recordPoint(
                {
                    pointA: (currentMatch.current_point_a || '0') as RegularPoint,
                    pointB: (currentMatch.current_point_b || '0') as RegularPoint,
                    goldenPointEnabled,
                },
                winningTeam
            )

            if (regularResult.isGameWon) {
                // Game reguler selesai
                if (regularResult.winner === 'team_a') {
                    finalGamesA += 1
                } else {
                    finalGamesB += 1
                }
                finalPointA = '0'
                finalPointB = '0'

                // Cek pemenang match
                const matchWinner = checkMatchWinner(finalGamesA, finalGamesB, round)
                if (matchWinner) {
                    finalStatus = 'completed'
                    finalWinnerId = matchWinner === 'team_a' ? currentMatch.team_a_id : currentMatch.team_b_id
                    finalCompletedAt = new Date().toISOString()
                }
            } else {
                finalPointA = regularResult.pointA
                finalPointB = regularResult.pointB
            }
        }

        // 5. Jika status match sebelumnya 'scheduled', ubah menjadi 'live' saat poin pertama dicatat
        if (finalStatus === 'scheduled') {
            finalStatus = 'live'
        }

        // 6. Update row matches dengan hasil akhir (Compare-and-swap atomik)
        const lockExpiryThresholdIso = new Date(now - SESSION_LOCK_TTL_MS).toISOString()
        const { data: updatedMatch, error: updateError } = await supabase
            .from('matches')
            .update({
                current_point_a: finalPointA,
                current_point_b: finalPointB,
                games_team_a: finalGamesA,
                games_team_b: finalGamesB,
                status: finalStatus,
                winner_team_id: finalWinnerId,
                completed_at: finalCompletedAt,
                active_scorer_session_id: clientSessionId,
                active_scorer_claimed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', matchId)
            .or(`active_scorer_session_id.eq.${clientSessionId},active_scorer_session_id.is.null,active_scorer_claimed_at.lt.${lockExpiryThresholdIso}`)
            .select(`
                *,
                team_a:teams!matches_team_a_id_fkey(*),
                team_b:teams!matches_team_b_id_fkey(*),
                category:categories(*)
            `)
            .maybeSingle()

        if (updateError || !updatedMatch) {
            console.error('Update Match Score Error:', updateError)
            return {
                success: false,
                message: 'Gagal mencatat poin: Sesi scoring Anda telah kedaluwarsa atau pertandingan diambil alih oleh device lain.',
            }
        }

        revalidatePath('/admin/scoring')
        revalidatePath(`/display/court/${currentMatch.court_id}`)
        revalidatePath('/display/courts')

        return {
            success: true,
            message: finalStatus === 'completed' ? 'Pertandingan telah selesai!' : 'Poin berhasil dicatat.',
            data: updatedMatch as unknown as Match,
        }
    } catch (err: unknown) {
        console.error('Record Point Action Error:', err)
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat mencatat poin.',
        }
    }
}

/**
 * Server Action: Undo poin terakhir yang tercatat
 * 1. Verifikasi sesi scoring aktif (compare-and-swap)
 * 2. Ambil snapshot terakhir dari match_score_history
 * 3. Kembalikan kondisi row matches ke snapshot tersebut
 * 4. Hapus snapshot yang sudah dipakai
 */
export async function undoLastPointAction(
    matchId: string,
    clientSessionId?: string
): Promise<ScoringActionResponse> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase) {
            return { success: false, message: auth.error || 'Akses ditolak.' }
        }
        const supabase = auth.supabase

        // Verifikasi kepemilikan sesi (compare-and-swap)
        if (!clientSessionId) {
            return {
                success: false,
                message: 'Akses ditolak: Device session ID tidak valid atau tidak ditemukan.',
            }
        }

        const { data: currentMatch } = await supabase
            .from('matches')
            .select('active_scorer_session_id, active_scorer_claimed_at, court_id')
            .eq('id', matchId)
            .single()

        const now = Date.now()
        if (currentMatch) {
            const claimedAtTime = currentMatch.active_scorer_claimed_at
                ? new Date(currentMatch.active_scorer_claimed_at).getTime()
                : 0
            const isClaimExpired = !currentMatch.active_scorer_claimed_at || (now - claimedAtTime > SESSION_LOCK_TTL_MS)

            if (
                currentMatch.active_scorer_session_id &&
                currentMatch.active_scorer_session_id !== clientSessionId &&
                !isClaimExpired
            ) {
                return {
                    success: false,
                    message: 'Akses ditolak: Match ini sedang di-score oleh device lain. Sesi Anda tidak valid atau telah diambil alih.',
                }
            }
        }

        // 1. Ambil snapshot TERAKHIR (created_at DESC LIMIT 1)
        const { data: lastSnapshot, error: snapshotError } = await supabase
            .from('match_score_history')
            .select('*')
            .eq('match_id', matchId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (snapshotError || !lastSnapshot) {
            return { success: false, message: 'Tidak ada riwayat untuk di-undo.' }
        }

        // 2. Kembalikan row matches ke nilai snapshot tersebut (Compare-and-swap atomik)
        const lockExpiryThresholdIso = new Date(now - SESSION_LOCK_TTL_MS).toISOString()
        const { data: restoredMatch, error: restoreError } = await supabase
            .from('matches')
            .update({
                current_point_a: lastSnapshot.point_a,
                current_point_b: lastSnapshot.point_b,
                games_team_a: lastSnapshot.games_team_a,
                games_team_b: lastSnapshot.games_team_b,
                status: lastSnapshot.status,
                winner_team_id: lastSnapshot.winner_team_id,
                completed_at: lastSnapshot.status === 'completed' ? new Date().toISOString() : null,
                active_scorer_session_id: clientSessionId,
                active_scorer_claimed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', matchId)
            .or(`active_scorer_session_id.eq.${clientSessionId},active_scorer_session_id.is.null,active_scorer_claimed_at.lt.${lockExpiryThresholdIso}`)
            .select(`
                *,
                team_a:teams!matches_team_a_id_fkey(*),
                team_b:teams!matches_team_b_id_fkey(*),
                category:categories(*)
            `)
            .maybeSingle()

        if (restoreError || !restoredMatch) {
            console.error('Restore Match Error:', restoreError)
            return {
                success: false,
                message: 'Gagal melakukan undo poin: Sesi scoring Anda tidak valid atau pertandingan diambil alih oleh device lain.',
            }
        }

        // 3. Hapus snapshot tersebut dari match_score_history
        await supabase
            .from('match_score_history')
            .delete()
            .eq('id', lastSnapshot.id)

        revalidatePath('/admin/scoring')
        revalidatePath(`/display/court/${restoredMatch.court_id}`)
        revalidatePath('/display/courts')

        return {
            success: true,
            message: 'Poin terakhir berhasil di-undo.',
            data: restoredMatch as unknown as Match,
        }
    } catch (err: unknown) {
        console.error('Undo Point Action Error:', err)
        return {
            success: false,
            message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat melakukan undo.',
        }
    }
}

/**
 * Server Action: Mengambil jumlah snapshot riwayat untuk suatu match
 */
export async function getScoreHistoryCountAction(matchId: string): Promise<number> {
    try {
        const supabase = await createClient()
        const { count, error } = await supabase
            .from('match_score_history')
            .select('id', { count: 'exact', head: true })
            .eq('match_id', matchId)

        if (error) {
            return 0
        }
        return count || 0
    } catch {
        return 0
    }
}
