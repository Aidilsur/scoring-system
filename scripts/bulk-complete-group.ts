import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import { sortGroupStandings } from '../lib/scoring'
import type { StandingRow, Match, Team } from '../types/domain'

/**
 * ==============================================================================
 * 1. Environment Loading (.env)
 * ==============================================================================
 */
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
    if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envPath)
    } else {
        const content = fs.readFileSync(envPath, 'utf8')
        for (const line of content.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#')) continue
            const eqIdx = trimmed.indexOf('=')
            if (eqIdx !== -1) {
                const key = trimmed.slice(0, eqIdx).trim()
                const val = trimmed.slice(eqIdx + 1).trim()
                if (!process.env[key]) {
                    process.env[key] = val
                }
            }
        }
    }
}

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const nodeEnv = process.env.NODE_ENV || 'development'

/**
 * ==============================================================================
 * 2. Safety Guards (Sama persis seperti scripts/seed.ts)
 * Mencegah eksekusi script testing dev secara tidak sengaja ke database production.
 * ==============================================================================
 */
function runSafetyGuards() {
    // Guard 1: Cek NODE_ENV
    if (nodeEnv.toLowerCase() === 'production') {
        console.error(
            '\n❌ [GUARD REJECTED] Script bulk-complete DITOLAK: NODE_ENV terdeteksi "production".'
        )
        console.error('Script ini hanya untuk keperluan development dan testing lokal.\n')
        process.exit(1)
    }

    // Guard 2: Cek ketersediaan kredensial
    if (!rawSupabaseUrl) {
        console.error('❌ [ERROR] NEXT_PUBLIC_SUPABASE_URL tidak ditemukan di .env!')
        process.exit(1)
    }

    if (!supabaseServiceRoleKey) {
        console.error(
            '❌ [ERROR] SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env! Service role key dibutuhkan untuk bypass RLS.'
        )
        process.exit(1)
    }

    // Guard 3: Periksa indikasi URL database production
    const normalizedUrl = rawSupabaseUrl.toLowerCase()
    const hasProductionKeyword =
        normalizedUrl.includes('prod') || normalizedUrl.includes('production')

    if (hasProductionKeyword) {
        console.error(
            `\n❌ [GUARD REJECTED] Script bulk-complete DITOLAK: Target URL mengandung kata "prod/production": ${rawSupabaseUrl}`
        )
        process.exit(1)
    }
}

/**
 * ==============================================================================
 * 3. Helper: Parse CLI Arguments
 * ==============================================================================
 */
function getCategoryArgument(): string | null {
    const args = process.argv.slice(2)
    for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        if (arg.startsWith('--category=')) {
            return arg.slice('--category='.length).replace(/^['"]|['"]$/g, '').trim()
        }
        if (arg === '--category' || arg === '-c') {
            return (args[i + 1] || '').replace(/^['"]|['"]$/g, '').trim() || null
        }
    }
    // Jika user menulis tanpa flag, misal: npx tsx scripts/bulk-complete-group.ts "Fix Partner - Bronze"
    const nonFlagArgs = args.filter((a) => !a.startsWith('-'))
    if (nonFlagArgs.length > 0) {
        return nonFlagArgs.join(' ').replace(/^['"]|['"]$/g, '').trim()
    }
    return null
}

/**
 * ==============================================================================
 * 4. Main Execution
 * ==============================================================================
 */
async function main() {
    runSafetyGuards()

    const cleanSupabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '')
    const supabase = createClient<Database>(cleanSupabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })

    const targetCategoryName = getCategoryArgument()

    // 1. Jika nama kategori tidak diberikan, tampilkan error dan daftar kategori
    if (!targetCategoryName) {
        console.error('\n❌ [ERROR] Parameter nama kategori tidak diberikan!\n')
        console.log('📖 Format Penggunaan:')
        console.log('   npm run bulk-complete -- --category="Nama Kategori"')
        console.log('   npx tsx scripts/bulk-complete-group.ts --category="Nama Kategori"\n')

        const { data: allCategories } = await supabase
            .from('categories')
            .select('id, name, partner_type, level, is_active')
            .order('name', { ascending: true })

        if (allCategories && allCategories.length > 0) {
            console.log('📋 Daftar Kategori Yang Tersedia di Database:')
            allCategories.forEach((cat, idx) => {
                console.log(
                    `   ${idx + 1}. "${cat.name}" [${cat.partner_type.toUpperCase()} - ${cat.level.toUpperCase()}] ${
                        cat.is_active ? '(Aktif)' : '(Nonaktif)'
                    }`
                )
            })
            console.log('')
        } else {
            console.log('⚠️ Belum ada kategori yang tersimpan di database.\n')
        }

        process.exit(1)
    }

    console.log(`\n🔍 Mencari kategori: "${targetCategoryName}"...`)

    // 2. Ambil detail kategori dari Supabase
    const { data: category, error: catError } = await supabase
        .from('categories')
        .select('*')
        .ilike('name', targetCategoryName)
        .maybeSingle()

    if (catError || !category) {
        console.error(`\n❌ [ERROR] Kategori "${targetCategoryName}" tidak ditemukan di database!\n`)

        const { data: allCategories } = await supabase
            .from('categories')
            .select('name')
            .order('name', { ascending: true })

        if (allCategories && allCategories.length > 0) {
            console.log('📋 Nama kategori yang tersedia:')
            allCategories.forEach((cat) => console.log(`   - "${cat.name}"`))
            console.log('')
        }
        process.exit(1)
    }

    console.log(`✅ Kategori ditemukan: "${category.name}" (ID: ${category.id})`)

    // 3. Ambil seluruh match round='group' untuk kategori ini
    const { data: groupMatchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
            id,
            group_id,
            round,
            status,
            team_a_id,
            team_b_id,
            games_team_a,
            games_team_b,
            team_a:teams!matches_team_a_id_fkey(id, player1_name, player2_name),
            team_b:teams!matches_team_b_id_fkey(id, player1_name, player2_name),
            group:groups(id, name)
        `)
        .eq('category_id', category.id)
        .eq('round', 'group')
        .order('created_at', { ascending: true })

    if (matchesError) {
        console.error(`❌ [ERROR] Gagal mengambil pertandingan: ${matchesError.message}`)
        process.exit(1)
    }

    const allGroupMatches = groupMatchesData || []
    if (allGroupMatches.length === 0) {
        console.log(
            `\n⚠️ Belum ada pertandingan babak grup untuk kategori "${category.name}".`
        )
        console.log('   Silakan lakukan drawing grup terlebih dahulu di menu /admin/draw.\n')
        process.exit(0)
    }

    const pendingMatches = allGroupMatches.filter((m) => m.status !== 'completed')
    const completedMatches = allGroupMatches.filter((m) => m.status === 'completed')

    console.log(`\n📊 Status Pertandingan Babak Grup saat ini:`)
    console.log(`   - Total Match      : ${allGroupMatches.length}`)
    console.log(`   - Sudah Selesai    : ${completedMatches.length}`)
    console.log(`   - Belum Selesai    : ${pendingMatches.length}`)

    // 4. Jika semua match sudah completed (Idempotent)
    if (pendingMatches.length === 0) {
        console.log(
            `\n✨ [IDEMPOTENT] Seluruh ${allGroupMatches.length} pertandingan fase grup sudah berstatus 'completed'.`
        )
        console.log('   Tidak ada match yang perlu diperbarui ulang.\n')
    } else {
        console.log(`\n🎲 Melakukan simulasi skor acak untuk ${pendingMatches.length} match...`)
        console.log(`   (Aturan §4.4: Best of 5 games, pemenang meraih 3 game: 3-0, 3-1, atau 3-2)\n`)

        let updatedCount = 0

        for (const match of pendingMatches) {
            // Acak pemenang antara Team A dan Team B
            const winnerIsTeamA = Math.random() < 0.5

            // Acak skor kekalahan yang valid: 0, 1, atau 2
            const losingScore = Math.floor(Math.random() * 3) // 0 | 1 | 2
            const gamesTeamA = winnerIsTeamA ? 3 : losingScore
            const gamesTeamB = winnerIsTeamA ? losingScore : 3
            const winnerTeamId = winnerIsTeamA ? match.team_a_id : match.team_b_id

            const teamAName = (match.team_a as any)
                ? `${(match.team_a as any).player1_name}/${(match.team_a as any).player2_name}`
                : match.team_a_id.slice(0, 8)
            const teamBName = (match.team_b as any)
                ? `${(match.team_b as any).player1_name}/${(match.team_b as any).player2_name}`
                : match.team_b_id.slice(0, 8)
            const groupName = (match.group as any)?.name || 'Grup'

            const { error: updateError } = await supabase
                .from('matches')
                .update({
                    games_team_a: gamesTeamA,
                    games_team_b: gamesTeamB,
                    winner_team_id: winnerTeamId,
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    current_point_a: '0',
                    current_point_b: '0',
                })
                .eq('id', match.id)

            if (updateError) {
                console.error(`   ❌ Gagal update match ${match.id}: ${updateError.message}`)
            } else {
                updatedCount++
                const winnerLabel = winnerIsTeamA ? teamAName : teamBName
                console.log(
                    `   ✅ [${groupName}] ${teamAName} vs ${teamBName} -> Skor: ${gamesTeamA} - ${gamesTeamB} (Pemenang: ${winnerLabel})`
                )
            }
        }

        console.log(`\n🎉 Berhasil menyelesaikan ${updatedCount} pertandingan!`)
    }

    // 5. Ambil dan tampilkan klasemen sementara hasil update
    console.log(`\n=================================================================`)
    console.log(`🏆 KLASEMEN SEMENTARA KATEGORI: ${category.name.toUpperCase()}`)
    console.log(`=================================================================`)

    // Ambil semua grup pada kategori ini
    const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name')
        .eq('category_id', category.id)
        .order('name', { ascending: true })

    const groups = groupsData || []
    if (groups.length === 0) {
        console.log('Tidak ada grup yang ditemukan.')
        process.exit(0)
    }

    const groupIds = groups.map((g) => g.id)

    // Ambil data dari VIEW 'standings'
    const { data: standingsData, error: stError } = await supabase
        .from('standings')
        .select('*')
        .in('group_id', groupIds)

    if (stError) {
        console.error(`❌ Gagal mengambil VIEW standings: ${stError.message}`)
        process.exit(1)
    }

    // Ambil data tim untuk nama pemain
    const { data: teamsData } = await supabase
        .from('teams')
        .select('id, player1_name, player2_name')
        .eq('category_id', category.id)

    const teamsMap: Record<string, Team> = {}
    for (const t of (teamsData as unknown as Team[]) || []) {
        teamsMap[t.id] = t
    }

    // Ambil seluruh match yang sudah selesai untuk keperluan tie-breaker
    const { data: completedMatchesAll } = await supabase
        .from('matches')
        .select('*')
        .eq('category_id', category.id)
        .eq('round', 'group')
        .eq('status', 'completed')

    const completedMatchesList = (completedMatchesAll as unknown as Match[]) || []

    for (const grp of groups) {
        console.log(`\n📌 GRUP: ${grp.name}`)

        const groupRows = ((standingsData as unknown as StandingRow[]) || [])
            .filter((r) => r.group_id === grp.id)
            .map((r) => ({
                ...r,
                team: teamsMap[r.team_id] || null,
                group: grp,
            }))

        const matchesInGroup = completedMatchesList.filter((m) => m.group_id === grp.id)

        // Urutkan menggunakan aturan resmi §4.5 (sortGroupStandings)
        const sortedResult = sortGroupStandings(groupRows, matchesInGroup)

        const tableData = sortedResult.standings.map((item) => {
            const teamObj = item.team
            const teamName = teamObj
                ? `${teamObj.player1_name} / ${teamObj.player2_name}`
                : item.team_id.slice(0, 8)

            return {
                Rank: item.rank,
                Tim: teamName,
                Main: item.played,
                Menang: item.won,
                Kalah: item.lost,
                'Diff Game': item.game_diff > 0 ? `+${item.game_diff}` : item.game_diff,
                Poin: item.points,
                Status: item.isQualified ? '⭐ Lolos Semifinal' : '-',
            }
        })

        console.table(tableData)

        if (sortedResult.hasTieRequiringManualDecision) {
            console.log('⚠️ [Catatan]: Terdapat perolehan poin & tie-breaker yang identik (perlu keputusan panitia).')
        }
    }

    console.log(`\n=================================================================`)
    console.log(`✅ Bulk complete selesai. Data klasemen otomatis sinkron via Realtime/View!`)
    console.log(`=================================================================\n`)
}

main().catch((err) => {
    console.error('\n❌ Terjadi kesalahan fatal:', err instanceof Error ? err.message : err)
    process.exit(1)
})
