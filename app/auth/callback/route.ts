import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Route handler untuk callback Google OAuth via Supabase Auth.
 * Menukar auth code menjadi user session dan mengarahkan ke dashboard admin.
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') || '/admin'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            console.error('Exchange Code for Session Error:', error.message)
            return NextResponse.redirect(
                `${origin}/admin/login?error=${encodeURIComponent(error.message)}`
            )
        }
    }

    // Jika tidak ada code auth, kembalikan ke login dengan pesan error
    return NextResponse.redirect(
        `${origin}/admin/login?error=${encodeURIComponent('Kode autentikasi tidak ditemukan')}`
    )
}
