import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export interface ProtectedAdminLayoutProps {
    children: ReactNode
}

/**
 * ProtectedAdminLayout
 * Server Component Layout untuk seluruh rute terproteksi di bawah /admin.
 * 
 * Alur Otorisasi Multi-Role:
 * 1. Verifikasi supabase.auth.getUser() di server. Jika belum login -> redirect /admin/login.
 * 2. Query tabel admin_users berdasarkan email user yang login.
 * 3. Jika email TIDAK ditemukan: tolak akses, logout paksa session, redirect ke /admin/login ("Akun tidak terdaftar").
 * 4. Jika role='referee': batasi akses HANYA ke /admin/scoring (redirect jika mencoba membuka halaman lain).
 * 5. Jika role='admin': akses diberikan penuh ke seluruh modul admin.
 */
export default async function ProtectedAdminLayout({
    children,
}: ProtectedAdminLayoutProps) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/admin/login')
    }

    const userEmail = user.email?.toLowerCase().trim()
    let adminUser = null

    if (userEmail) {
        const { data, error } = await supabase
            .from('admin_users')
            .select('id, email, role')
            .eq('email', userEmail)
            .maybeSingle()

        if (error) {
            // Graceful dev handling jika tabel admin_users belum di-push ke database remote
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                console.warn(
                    '⚠️ [WARN] Tabel admin_users belum dibuat di database Supabase. Jalankan migration add_admin_users_role terlebih dahulu.'
                )
                return <>{children}</>
            }
        } else if (data) {
            adminUser = data
        }
    }

    // 1. Jika email tidak terdaftar di tabel admin_users, tolak akses dan paksa logout
    if (!adminUser) {
        await supabase.auth.signOut()
        redirect(`/admin/login?error=${encodeURIComponent('Akun tidak terdaftar')}`)
    }

    // 2. Jika role='referee', batasi akses HANYA ke /admin/scoring
    if (adminUser.role === 'referee') {
        const headersList = await headers()
        const pathname = headersList.get('x-pathname') || ''

        if (pathname !== '/admin/scoring' && !pathname.startsWith('/admin/scoring/')) {
            redirect('/admin/scoring')
        }
    }

    // 3. Jika role='admin', akses penuh
    return <>{children}</>
}
