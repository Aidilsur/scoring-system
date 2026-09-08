'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action: Trigger Google OAuth Sign-In
 * Menghasilkan URL autentikasi Google dari Supabase dan mengarahkan browser ke sana.
 */
export async function signInWithGoogleAction(nextPath: string = '/admin') {
    const supabase = await createClient()
    const headerList = await headers()

    const host =
        headerList.get('x-forwarded-host') ||
        headerList.get('host') ||
        'localhost:3000'
    const proto =
        headerList.get('x-forwarded-proto') ||
        (process.env.NODE_ENV === 'development' ? 'http' : 'https')
    const origin = `${proto}://${host}`

    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    })

    if (error) {
        console.error('Google OAuth Trigger Error:', error.message)
        redirect(`/admin/login?error=${encodeURIComponent(error.message)}`)
    }

    if (data?.url) {
        redirect(data.url)
    }
}

/**
 * Server Action: Sign-Out Admin
 * Mengakhiri session Supabase dan me-redirect ke halaman login admin.
 */
export async function signOutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/admin/login')
}
