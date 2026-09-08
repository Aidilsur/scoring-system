import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware helper untuk Next.js App Router sesuai pola resmi @supabase/ssr.
 * - Merefresh session token Supabase pada setiap incoming request
 * - Memproteksi rute /admin/* agar hanya bisa diakses setelah login
 * - Mengalihkan user yang sudah login dari /admin/login ke /admin
 */
export async function updateSession(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', request.nextUrl.pathname)

    let supabaseResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })

    const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, '') || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                )
                supabaseResponse = NextResponse.next({
                    request: {
                        headers: requestHeaders,
                    },
                })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                )
            },
        },
    })

    // Ambil data user dari Supabase Auth
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // 1. Proteksi route /admin/* (kecuali /admin/login)
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        if (!user) {
            const redirectUrl = request.nextUrl.clone()
            redirectUrl.pathname = '/admin/login'
            redirectUrl.searchParams.set('redirectTo', pathname)
            return NextResponse.redirect(redirectUrl)
        }
    }

    // 2. Jika user sudah login dan mengakses /admin/login, redirect langsung ke /admin
    if (pathname === '/admin/login' && user) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/admin'
        return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
}
