import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

/**
 * --------------------------------------------------------------------------
 * 1. Environment Loading (.env)
 * --------------------------------------------------------------------------
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
 * --------------------------------------------------------------------------
 * 2. Safety Guards
 * Mencegah eksekusi seed yang tidak disengaja ke database production.
 * --------------------------------------------------------------------------
 */
function runSafetyGuards() {
    console.log('🔍 Menjalankan pemeriksaan keamanan (Safety Guards)...')

    // Guard 1: Cek NODE_ENV
    if (nodeEnv.toLowerCase() === 'production') {
        console.error(
            '\n❌ [GUARD REJECTED] Script seed DITOLAK: NODE_ENV terdeteksi "production".'
        )
        console.error('Seed hanya diizinkan untuk lingkungan lokal dan development.\n')
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
    const isLocalhost =
        normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1')
    const hasProductionKeyword =
        normalizedUrl.includes('prod') || normalizedUrl.includes('production')

    // Jika URL mengandung kata 'prod' atau 'production'
    if (hasProductionKeyword) {
        console.error(
            `\n❌ [GUARD REJECTED] Script seed DITOLAK: Target URL mengandung kata "prod/production": ${rawSupabaseUrl}`
        )
        process.exit(1)
    }

    // Ekstrak project ref untuk logging audit
    let projectRef = 'unknown'
    try {
        const parsedUrl = new URL(rawSupabaseUrl)
        const hostParts = parsedUrl.hostname.split('.')
        if (hostParts.length > 0) {
            projectRef = hostParts[0]
        }
    } catch {
        // Abaikan jika parsing URL gagal
    }

    console.log('✅ Safety guards lolos:')
    console.log(`   - Environment : ${nodeEnv}`)
    console.log(`   - Target Host : ${rawSupabaseUrl}`)
    console.log(`   - Project Ref : ${projectRef}`)
    console.log(`   - Local DB?   : ${isLocalhost ? 'Ya' : 'Tidak (Cloud Dev)'}\n`)
}

/**
 * --------------------------------------------------------------------------
 * 3. Seed Execution
 * --------------------------------------------------------------------------
 */
async function seedDatabase() {
    runSafetyGuards()

    // Normalisasi URL untuk @supabase/supabase-js (buang /rest/v1 jika ada)
    const cleanSupabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '')

    const supabase = createClient<Database>(cleanSupabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })

    console.log('🚀 Memulai proses seeding data dummy...\n')

    try {
        // ----------------------------------------------------------------------
        // 3.1. Insert / Re-create Tournament Settings
        // ----------------------------------------------------------------------
        console.log('1️⃣ Memasukkan data tournament_settings ("Turnamen Testing")...')
        
        const { data: tournamentData, error: tournamentError } = await supabase
            .from('tournament_settings')
            .insert({
                name: 'Turnamen Testing',
                team_per_group: 4,
                number_of_courts: 2,
                match_duration_minutes: 45,
                daily_start_time: '08:00',
                daily_end_time: '18:00',
                golden_point_enabled: true,
                third_place_enabled: true,
                status: 'draft',
            })
            .select('*')
            .single()

        if (tournamentError || !tournamentData) {
            throw new Error(`Gagal insert tournament_settings: ${tournamentError?.message}`)
        }

        const tournamentId = tournamentData.id
        console.log(`   ✅ Tournament Settings tersimpan (ID: ${tournamentId})`)

        // ----------------------------------------------------------------------
        // 3.2. Insert 2 Courts (Court 1, Court 2)
        // ----------------------------------------------------------------------
        console.log('2️⃣ Memasukkan data 2 courts (Court 1, Court 2)...')

        const courtsPayload = [
            { tournament_id: tournamentId, name: 'Court 1' },
            { tournament_id: tournamentId, name: 'Court 2' },
        ]

        const { data: courtsData, error: courtsError } = await supabase
            .from('courts')
            .insert(courtsPayload)
            .select('*')

        if (courtsError || !courtsData) {
            throw new Error(`Gagal insert courts: ${courtsError?.message}`)
        }

        console.log(`   ✅ 2 Courts berhasil dibuat:`)
        courtsData.forEach((c) => console.log(`      - ${c.name} (ID: ${c.id})`))

        // ----------------------------------------------------------------------
        // 3.3. Insert 2 Categories
        // Category 1: "Fix Partner - Bronze" (fix, bronze, is_active: true)
        // Category 2: "Mix Partner - Beginner" (mix, beginner, is_active: true)
        // ----------------------------------------------------------------------
        console.log('3️⃣ Memasukkan 2 kategori turnamen aktif...')

        const categoriesPayload = [
            {
                name: 'Fix Partner - Bronze',
                partner_type: 'fix' as const,
                level: 'bronze' as const,
                is_active: true,
            },
            {
                name: 'Mix Partner - Beginner',
                partner_type: 'mix' as const,
                level: 'beginner' as const,
                is_active: true,
            },
        ]

        const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .insert(categoriesPayload)
            .select('*')

        if (categoriesError || !categoriesData) {
            throw new Error(`Gagal insert categories: ${categoriesError?.message}`)
        }

        const category1 = categoriesData.find((c) => c.name === 'Fix Partner - Bronze')!
        const category2 = categoriesData.find((c) => c.name === 'Mix Partner - Beginner')!

        console.log(`   ✅ 2 Kategori berhasil dibuat:`)
        console.log(`      - ${category1.name} (ID: ${category1.id})`)
        console.log(`      - ${category2.name} (ID: ${category2.id})`)

        // ----------------------------------------------------------------------
        // 3.4. Insert Teams
        // Kategori 1: 8 tim (2 grup @ 4 tim) -> Player 1A/1B s.d. 8A/8B
        // Kategori 2: 8 tim (2 grup @ 4 tim) -> Player 9A/9B s.d. 16A/16B
        // Status: 'confirmed', payment_proof_url: placeholder
        // ----------------------------------------------------------------------
        console.log('4️⃣ Memasukkan 8 tim untuk Kategori 1 dan 8 tim untuk Kategori 2 (total 16 tim)...')

        const placeholderProof = 'https://placehold.co/600x400/png?text=Payment+Proof'

        const teamsPayload = [
            // Kategori 1: 8 Tim
            ...Array.from({ length: 8 }, (_, i) => {
                const teamNum = i + 1
                return {
                    category_id: category1.id,
                    player1_name: `Test Player ${teamNum}A`,
                    player2_name: `Test Player ${teamNum}B`,
                    phone_number: `08120000000${teamNum}`,
                    instagram_handle: `@testplayer_${teamNum}`,
                    reclub_handle: `player_${teamNum}`,
                    payment_proof_url: placeholderProof,
                    status: 'confirmed' as const,
                }
            }),
            // Kategori 2: 8 Tim
            ...Array.from({ length: 8 }, (_, i) => {
                const teamNum = i + 9
                return {
                    category_id: category2.id,
                    player1_name: `Test Player ${teamNum}A`,
                    player2_name: `Test Player ${teamNum}B`,
                    phone_number: `0812000000${teamNum < 10 ? '0' + teamNum : teamNum}`,
                    instagram_handle: `@testplayer_${teamNum}`,
                    reclub_handle: `player_${teamNum}`,
                    payment_proof_url: placeholderProof,
                    status: 'confirmed' as const,
                }
            }),
        ]

        const { data: teamsData, error: teamsError } = await supabase
            .from('teams')
            .insert(teamsPayload)
            .select('id, category_id, player1_name, player2_name, status')

        if (teamsError || !teamsData) {
            throw new Error(`Gagal insert teams: ${teamsError?.message}`)
        }

        const cat1Teams = teamsData.filter((t) => t.category_id === category1.id)
        const cat2Teams = teamsData.filter((t) => t.category_id === category2.id)

        console.log(`   ✅ Berhasil membuat total ${teamsData.length} tim:`)
        console.log(`      - ${cat1Teams.length} tim terkonfirmasi di "${category1.name}"`)
        console.log(`      - ${cat2Teams.length} tim terkonfirmasi di "${category2.name}"`)

        console.log('\n🎉 [SUKSES] Seeding selesai dengan sempurna!')
        console.log('Ringkasan Data yang Dibuat:')
        console.log(`- 1 Tournament: "${tournamentData.name}" (${tournamentData.match_duration_minutes}m/match, ${tournamentData.daily_start_time}-${tournamentData.daily_end_time})`)
        console.log(`- 2 Courts: Court 1 & Court 2`)
        console.log(`- 2 Kategori: "${category1.name}" & "${category2.name}"`)
        console.log(`- 16 Tim: Status 'confirmed' (masing-masing 8 tim / 2 grup @ 4 tim), siap untuk uji coba alur turnamen lengkap.\n`)
    } catch (err: unknown) {
        console.error('\n❌ Terjadi kesalahan saat seeding:', err instanceof Error ? err.message : err)
        process.exit(1)
    }
}

// Jalankan fungsi seed
seedDatabase()
