'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateDrawSchema } from '@/lib/validations/draw'
import {
  distributeTeamsToGroups,
  generateGroupDraw,
  generateRoundRobinSchedule,
} from '@/lib/draw'
import { Team } from '@/types/domain'

export interface DrawActionResponse {
  success: boolean
  message: string
  groupsCount?: number
  matchesCount?: number
}

/**
 * Server Action: Generate atau Regenerate Drawing Grup & Jadwal Round Robin per Kategori
 * 
 * Aturan Bisnis (§4.3):
 * 1. Ambil semua tim berstatus 'confirmed' di kategori terpilih.
 * 2. Hitung distribusi grup seserata mungkin (distributeTeamsToGroups).
 * 3. Acak tim secara uniform dengan Fisher-Yates (generateGroupDraw).
 * 4. Simpan ke tabel groups dan group_teams.
 * 5. Buat pertandingan round robin (generateRoundRobinSchedule) dan simpan ke tabel matches.
 * 6. Regenerate HANYA diizinkan jika belum ada pertandingan yang berstatus 'live' atau 'completed'.
 */
export async function generateCategoryDrawAction(
  categoryId: string
): Promise<DrawActionResponse> {
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

    // 2. Validasi input
    const validation = generateDrawSchema.safeParse({ categoryId })
    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message || 'Kategori turnamen tidak valid.',
      }
    }

    // 3. Ambil konfigurasi turnamen (team_per_group & status)
    const { data: settings } = await supabase
      .from('tournament_settings')
      .select('id, team_per_group, status')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const teamPerGroup = settings?.team_per_group ?? 4

    // 4. Periksa apakah sudah ada match di kategori ini dan pastikan turnamen belum dimulai
    const { data: existingMatches, error: matchesErr } = await supabase
      .from('matches')
      .select('id, status')
      .eq('category_id', categoryId)

    if (matchesErr) {
      return {
        success: false,
        message: `Gagal memeriksa status pertandingan: ${matchesErr.message}`,
      }
    }

    const hasStartedMatches = existingMatches?.some(
      (m) => m.status === 'live' || m.status === 'completed'
    )

    if (hasStartedMatches) {
      return {
        success: false,
        message:
          'Regenerate draw diblokir: Terdapat pertandingan yang sedang berlangsung (live) atau sudah selesai (completed) pada kategori ini. Drawing tidak boleh diubah saat turnamen sudah berjalan.',
      }
    }

    // 5. Ambil semua tim confirmed pada kategori ini
    const { data: confirmedTeams, error: teamsErr } = await supabase
      .from('teams')
      .select('*')
      .eq('category_id', categoryId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: true })

    if (teamsErr || !confirmedTeams) {
      return {
        success: false,
        message: `Gagal mengambil data peserta: ${teamsErr?.message || 'Data tidak ditemukan'}`,
      }
    }

    if (confirmedTeams.length < 2) {
      return {
        success: false,
        message:
          `Minimal harus ada 2 tim berstatus 'confirmed' untuk membuat drawing (saat ini ${confirmedTeams.length} tim).`,
      }
    }

    // 6. Jika sudah ada data draw lama (semua match masih 'scheduled'),
    // hapus data lama terlebih dahulu
    if (existingMatches && existingMatches.length > 0) {
      const { error: delMatchesErr } = await supabase
        .from('matches')
        .delete()
        .eq('category_id', categoryId)

      if (delMatchesErr) {
        return {
          success: false,
          message: `Gagal mereset pertandingan lama: ${delMatchesErr.message}`,
        }
      }
    }

    const { data: oldGroups } = await supabase
      .from('groups')
      .select('id')
      .eq('category_id', categoryId)

    if (oldGroups && oldGroups.length > 0) {
      const oldGroupIds = oldGroups.map((g) => g.id)

      const { error: delGroupTeamsErr } = await supabase
        .from('group_teams')
        .delete()
        .in('group_id', oldGroupIds)

      if (delGroupTeamsErr) {
        return {
          success: false,
          message: `Gagal mereset anggota grup lama: ${delGroupTeamsErr.message}`,
        }
      }

      const { error: delGroupsErr } = await supabase
        .from('groups')
        .delete()
        .eq('category_id', categoryId)

      if (delGroupsErr) {
        return {
          success: false,
          message: `Gagal mereset grup lama: ${delGroupsErr.message}`,
        }
      }
    }

    // 7. Hitung distribusi jumlah tim per grup secara merata
    const groupSizes = distributeTeamsToGroups(confirmedTeams.length, teamPerGroup)

    // 8. Generate draw: acak tim dengan Fisher-Yates & kelompokkan
    const drawnGroups = generateGroupDraw(confirmedTeams as Team[], groupSizes)

    // 9. Simpan grup baru, relasi group_teams, dan matches ke database
    let totalMatchesCreated = 0

    for (const group of drawnGroups) {
      // 9a. Simpan row groups
      const { data: insertedGroup, error: insertGroupErr } = await supabase
        .from('groups')
        .insert({
          category_id: categoryId,
          name: group.name,
        })
        .select('id')
        .single()

      if (insertGroupErr || !insertedGroup) {
        return {
          success: false,
          message: `Gagal menyimpan ${group.name}: ${insertGroupErr?.message}`,
        }
      }

      const groupId = insertedGroup.id

      // 9b. Simpan row group_teams
      const groupTeamsRows = group.teams.map((t) => ({
        group_id: groupId,
        team_id: t.id,
      }))

      const { error: insertGroupTeamsErr } = await supabase
        .from('group_teams')
        .insert(groupTeamsRows)

      if (insertGroupTeamsErr) {
        return {
          success: false,
          message: `Gagal mendaftarkan tim ke ${group.name}: ${insertGroupTeamsErr.message}`,
        }
      }

      // 9c. Generate jadwal round robin (kombinasi n*(n-1)/2 tanpa duplikasi)
      const teamIds = group.teams.map((t) => t.id)
      const pairings = generateRoundRobinSchedule(teamIds)

      if (pairings.length > 0) {
        const matchRows = pairings.map((pair) => ({
          category_id: categoryId,
          group_id: groupId,
          round: 'group',
          team_a_id: pair.teamAId,
          team_b_id: pair.teamBId,
          court_id: null,
          status: 'scheduled',
          games_team_a: 0,
          games_team_b: 0,
          current_point_a: '0',
          current_point_b: '0',
          scheduled_time: null,
          completed_at: null,
        }))

        const { error: insertMatchesErr } = await supabase
          .from('matches')
          .insert(matchRows)

        if (insertMatchesErr) {
          return {
            success: false,
            message: `Gagal membuat jadwal match ${group.name}: ${insertMatchesErr.message}`,
          }
        }

        totalMatchesCreated += matchRows.length
      }
    }

    // 10. Update tournament status ke 'draw_done' jika sebelumnya masih 'draft'
    if (settings?.id && settings.status === 'draft') {
      await supabase
        .from('tournament_settings')
        .update({ status: 'draw_done', updated_at: new Date().toISOString() })
        .eq('id', settings.id)
    }

    // 11. Revalidasi path admin
    revalidatePath('/admin/draw')
    revalidatePath('/admin')

    return {
      success: true,
      message:
        `Drawing berhasil dibuat: ${drawnGroups.length} grup dan ${totalMatchesCreated} pertandingan round robin siap dijadwalkan.`,
      groupsCount: drawnGroups.length,
      matchesCount: totalMatchesCreated,
    }
  } catch (err: unknown) {
    console.error('Unexpected Generate Draw Error:', err)
    return {
      success: false,
      message:
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan sistem saat memproses drawing turnamen.',
    }
  }
}
