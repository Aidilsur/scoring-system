import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface ProtectedAdminLayoutProps {
    children: ReactNode
}

/**
 * ProtectedAdminLayout
 * Server Component Layout untuk seluruh rute terproteksi di bawah /admin (dashboard, teams, dll).
 * Berfungsi sebagai defense-in-depth security layer di level RSC selain middleware.ts:
 * Melakukan verifikasi supabase.auth.getUser() di server.
 * Jika belum login, user langsung dialihkan ke /admin/login.
 *
 * Karena rute /admin/login berada di luar route group (protected),
 * halaman login tidak terbungkus layout ini, sehingga tidak memerlukan pengecekan x-pathname
 * dan bebas dari resiko infinite redirect loop.
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

    return <>{children}</>
}
