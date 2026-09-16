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

interface ScoringActionResponse {
    success: boolean
    message: string
    data?: Match
}

interface SessionClaimResponse {
    success: boolean
    isOwner: boolean
    message: string
    activeSessionId?: string | null
    claimedAt?: string | null
}

/**
 * Server Action: Mengklaim atau memperbarui sesi scoring wasit pada suatu match.
 * Basis identifikasi menggunakan email user yang terautentikasi (admin_users).
 * Jika match sudah diklaim akun lain dan claimed_at masih dalam TTL (2 menit),
 * permintaan ditolak (isOwner: false) dan akun/device lain masuk mode read-only.
 * Jika akun yang login SAMA, klaim diperbarui dan user dapat melanjutkan
 * scoring di tab/device manapun.
 */
export async function claimScorerSessionAction(
    matchId: string,
    _userIdentifier?: string
): Promise<SessionClaimResponse> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase || !auth.email) {
            return { success: false, isOwner: false, message: auth.error || 'Akses ditolak.' }
        }
        const supabase = auth.supabase
        const userEmail = auth.email

        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('id, active_scorer_session_id, active_scorer_claimed_at')
            .eq('id', matchId)
            .single()

        if (matchError || !match) {
            return { success: false, isOwner: false, message: 'Pertandingan tidak ditemukan.' }
        }

        const now = Date.now()
        const claimedAtTime = match.active_scorer_claimed_at
            ? new Date(match.active_scorer_claimed_at).getTime()
            : 0
        const isExpired =
            !match.active_scorer_claimed_at || (now - claimedAtTime > SESSION_LOCK_TTL_MS)
        const isCurrentOwner = match.active_scorer_session_id?.toLowerCase().trim() === userEmail

        // Jika sudah diklaim akun lain dan belum kedaluwarsa (<= 2 menit)
        if (match.active_scorer_session_id && !isCurrentOwner && !isExpired) {
            return {
                success: false,
                isOwner: false,
                message: `Match ini sedang di-score oleh akun wasit lain (${match.active_scorer_session_id}).`,
                activeSessionId: match.active_scorer_session_id,
                claimedAt: match.active_scorer_claimed_at,
            }
        }

        // Boleh diklaim secara atomik:
        // - jika active_scorer_session_id masih null
        // - ATAU active_scorer_claimed_at sudah lebih dari 2 menit lalu (SESSION_LOCK_TTL_MS)
        // - ATAU akun pemilik yang sama (renewal / heartbeat / multi-tab)
        const claimedAtIso = new Date().toISOString()
        const lockExpiryThresholdIso = new Date(now - SESSION_LOCK_TTL_MS).toISOString()

        const { data: updatedMatch, error: updateError } = await supabase
            .from('matches')
            .update({
                active_scorer_session_id: userEmail,
                active_scorer_claimed_at: claimedAtIso,
            })
            .eq('id', matchId)
            .or(`active_scorer_session_id.is.null,active_scorer_claimed_at.lt.${lockExpiryThresholdIso},active_scorer_session_id.eq.${userEmail}`)
            .select('id, active_scorer_session_id, active_scorer_claimed_at')
            .maybeSingle()

        if (updateError || !updatedMatch) {
            return {
                success: false,
                isOwner: false,
                message: 'Match ini sedang di-score oleh akun wasit lain.',
                activeSessionId: match.active_scorer_session_id,
                claimedAt: match.active_scorer_claimed_at,
            }
        }

        return {
            success: true,
            isOwner: true,
            message: 'Sesi scoring aktif.',
            activeSessionId: userEmail,
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
 * active_scorer_session_id masih cocok dengan email user yang login.
 */
export async function heartbeatScorerSessionAction(
    matchId: string,
    _userIdentifier?: string
): Promise<{ success: boolean; isOwner: boolean }> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase || !auth.email) {
            return { success: false, isOwner: false }
        }
        const supabase = auth.supabase
        const userEmail = auth.email

        if (!matchId) {
            return { success: false, isOwner: false }
        }

        const claimedAtIso = new Date().toISOString()
        const { data, error } = await supabase
            .from('matches')
            .update({
                active_scorer_claimed_at: claimedAtIso,
            })
            .eq('id', matchId)
            .eq('active_scorer_session_id', userEmail)
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
 * Server Action: Melepas kendali scoring (Tombol Lepas Kendali).
 * Mengosongkan active_scorer_session_id dan active_scorer_claimed_at menjadi NULL
 * jika email user yang login cocok dengan pemilik klaim saat ini.
 */
export async function releaseScorerSessionAction(
    matchId: string,
    _userIdentifier?: string
): Promise<{ success: boolean; message: string }> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase || !auth.email) {
            return { success: false, message: auth.error || 'Akses ditolak.' }
        }
        const supabase = auth.supabase
        const userEmail = auth.email

        if (!matchId) {
            return { success: false, message: 'ID match tidak valid.' }
        }

        const { data, error } = await supabase
            .from('matches')
            .update({
                active_scorer_session_id: null,
                active_scorer_claimed_at: null,
            })
            .eq('id', matchId)
            .eq('active_scorer_session_id', userEmail)
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

    return { authorized: true, user, email, supabase }
}

/**
 * Server Action: Mencatat penambahan poin pada pertandingan
 * 1. Ambil match & setting golden_point
 * 2. Cek compare-and-swap concurrency lock session berbasis user email
 * 3. Simpan snapshot kondisi sebelum diubah ke match_score_history
 * 4. Tentukan mode tiebreak / regular dan hitung progres poin
 * 5. Jika game selesai: tambah game, cek pemenang match (selesai jika tercapai target)
 * 6. Ubah status 'scheduled' menjadi 'live'
 * 7. Update database matches
 */
export async function recordPointAction(
    matchId: string,
    winningTeam: MatchTeam,
    _userIdentifier?: string
): Promise<ScoringActionResponse> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase || !auth.email) {
            return { success: false, message: auth.error || 'Akses ditolak.' }
        }
        const supabase = auth.supabase
        const userEmail = auth.email

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

        // Compare-and-swap: verifikasi active_scorer_session_id di database
        // masih sama dengan user email yang melakukan request
        const now = Date.now()
        const claimedAtTime = currentMatch.active_scorer_claimed_at
            ? new Date(currentMatch.active_scorer_claimed_at).getTime()
            : 0
        const isClaimExpired =
            !currentMatch.active_scorer_claimed_at ||
            now - claimedAtTime > SESSION_LOCK_TTL_MS

        if (
            currentMatch.active_scorer_session_id &&
            currentMatch.active_scorer_session_id.toLowerCase().trim() !== userEmail &&
            !isClaimExpired
        ) {
            return {
                success: false,
                message: `Akses ditolak: Match ini sedang di-score oleh akun wasit lain (${currentMatch.active_scorer_session_id}). Sesi Anda tidak valid atau telah diambil alih.`,
            }
        }

        // Cek apakah ada match LAIN di court yang sama yang sedang live
        // (mencegah 2 match live bersamaan di court fisik sama)
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
                const teamAData = (
                    Array.isArray(liveM.team_a) ? liveM.team_a[0] : liveM.team_a
                ) as { player1_name?: string; player2_name?: string } | null
                const teamBData = (
                    Array.isArray(liveM.team_b) ? liveM.team_b[0] : liveM.team_b
                ) as { player1_name?: string; player2_name?: string } | null
                const teamA = `${teamAData?.player1_name || 'Tim A'}/${teamAData?.player2_name || ''}`.trim()
                const teamB = `${teamBData?.player1_name || 'Tim B'}/${teamBData?.player2_name || ''}`.trim()
                return {
                    success: false,
                    message: `Court ini masih memiliki pertandingan yang sedang berlangsung (${teamA} vs ${teamB}). Selesaikan atau tandai match tersebut terlebih dahulu sebelum memulai match baru.`,
                }
            }
        }

        const { data: settings } = await supabase
            .from('tournament_settings')
            .select('golden_point')
            .limit(1)
            .maybeSingle()

        const goldenPointEnabled = settings?.golden_point ?? true

        // 2. Simpan snapshot kondisi sebelum poin dicatat ke match_score_history untuk fitur Undo
        const { error: historyError } = await supabase
            .from('match_score_history')
            .insert({
                match_id: matchId,
                point_a: currentMatch.current_point_a || '0',
                point_b: currentMatch.current_point_b || '0',
                games_team_a: currentMatch.games_team_a,
                games_team_b: currentMatch.games_team_b,
                status: currentMatch.status,
                winner_team_id: currentMatch.winner_team_id,
            })

        if (historyError) {
            console.error('Save Score History Error:', historyError)
            return { success: false, message: 'Gagal membuat snapshot riwayat poin untuk undo.' }
        }

        // 3. Tentukan apakah saat ini sedang dalam mode Tiebreak / Golden Game
        const isTiebreak = shouldStartTiebreakGame(
            currentMatch.games_team_a,
            currentMatch.games_team_b,
            currentMatch.round as MatchRound
        )

        let finalPointA = currentMatch.current_point_a || '0'
        let finalPointB = currentMatch.current_point_b || '0'
        let finalGamesA = currentMatch.games_team_a
        let finalGamesB = currentMatch.games_team_b
        let finalStatus: MatchStatus = currentMatch.status as MatchStatus
        let finalWinnerId: string | null = currentMatch.winner_team_id
        let finalCompletedAt: string | null = currentMatch.completed_at
        const round = currentMatch.round as MatchRound

        // 4. Hitung skor baru menggunakan pure function domain padel
        if (isTiebreak) {
            // Mode Tiebreak (Grup: skor 2-2 selisih 2 / Knockout: skor 5-5 sudden death)
            const currentTbPointA = parseInt(finalPointA, 10) || 0
            const currentTbPointB = parseInt(finalPointB, 10) || 0
            const requireWinBy2 = round === 'group'
            const tiebreakResult = recordTiebreakPoint(
                {
                    pointA: currentTbPointA,
                    pointB: currentTbPointB,
                },
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
                    finalWinnerId = matchWinner === 'team_a'
                        ? currentMatch.team_a_id
                        : currentMatch.team_b_id
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
                    finalWinnerId = matchWinner === 'team_a'
                        ? currentMatch.team_a_id
                        : currentMatch.team_b_id
                    finalCompletedAt = new Date().toISOString()
                }
            } else {
                finalPointA = regularResult.pointA
                finalPointB = regularResult.pointB
            }
        }

        // 5. Jika status match sebelumnya 'scheduled',
        // ubah menjadi 'live' saat poin pertama dicatat
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
                active_scorer_session_id: userEmail,
                active_scorer_claimed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', matchId)
            .or(`active_scorer_session_id.eq.${userEmail},active_scorer_session_id.is.null,active_scorer_claimed_at.lt.${lockExpiryThresholdIso}`)
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
                message: 'Gagal mencatat poin: Sesi scoring Anda telah kedaluwarsa atau pertandingan diambil alih oleh akun lain.',
            }
        }

        // Revalidate rute publik display court & list court agar realtime display sinkron
        if (currentMatch.court_id) {
            revalidatePath(`/display/court/${currentMatch.court_id}`)
        }
        revalidatePath('/display/courts')
        revalidatePath('/admin/scoring')

        const winnerLabel = winningTeam === 'team_a' ? 'Tim A' : 'Tim B'
        return {
            success: true,
            message: finalStatus === 'completed'
                ? `Pertandingan selesai! Dimenangkan oleh ${winnerLabel}.`
                : `Poin untuk ${winnerLabel} berhasil dicatat.`,
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
 * Server Action: Melakukan Undo 1 poin terakhir
 * Mengambil snapshot riwayat terbaru dari `match_score_history`, mengembalikan
 * state row matches ke snapshot tersebut, dan menghapus snapshot tersebut dari database.
 */
export async function undoLastPointAction(
    matchId: string,
    _userIdentifier?: string
): Promise<ScoringActionResponse> {
    try {
        const auth = await verifyScorerAuth()
        if (!auth.authorized || !auth.supabase || !auth.email) {
            return { success: false, message: auth.error || 'Akses ditolak.' }
        }
        const supabase = auth.supabase
        const userEmail = auth.email

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
            const isClaimExpired =
                !currentMatch.active_scorer_claimed_at ||
                now - claimedAtTime > SESSION_LOCK_TTL_MS

            if (
                currentMatch.active_scorer_session_id &&
                currentMatch.active_scorer_session_id.toLowerCase().trim() !== userEmail &&
                !isClaimExpired
            ) {
                return {
                    success: false,
                    message: `Akses ditolak: Match ini sedang di-score oleh akun wasit lain (${currentMatch.active_scorer_session_id}). Sesi Anda tidak valid atau telah diambil alih.`,
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
                active_scorer_session_id: userEmail,
                active_scorer_claimed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', matchId)
            .or(`active_scorer_session_id.eq.${userEmail},active_scorer_session_id.is.null,active_scorer_claimed_at.lt.${lockExpiryThresholdIso}`)
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
                message: 'Gagal melakukan undo poin: Sesi scoring Anda tidak valid atau pertandingan diambil alih oleh akun lain.',
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
