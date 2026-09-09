import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { GoogleLoginButton } from '@/components/admin/GoogleLoginButton'

export const metadata: Metadata = {
    title: 'Admin Login — Padel Tournament Scoring System',
    description: 'Login khusus admin untuk mengelola turnamen, drawing grup, dan live scoring.',
}

interface AdminLoginPageProps {
    searchParams: Promise<{
        error?: string
        redirectTo?: string
    }>
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
    const params = await searchParams
    const errorMessage = params.error
    const redirectTo = params.redirectTo || '/admin'

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
            {/* Background Sport Tech Ambient Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md mx-auto relative z-10 space-y-6">
                {/* Header Brand */}
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <Badge variant="success" size="md">
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                            Admin Portal
                        </Badge>
                    </div>

                    <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white uppercase">
                        Padel Tournament System
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto">
                        Masuk menggunakan akun Google Anda untuk mengelola turnamen, court, drawing, dan skor live.
                    </p>
                </div>

                {/* Login Card */}
                <Card variant="elevated" className="bg-zinc-900/90 border-zinc-800 backdrop-blur-xl p-8 space-y-6">
                    {/* Alert Pesan Error jika OAuth Gagal */}
                    {errorMessage && (
                        <div className="bg-rose-950/40 border border-rose-900/60 rounded-2xl p-4 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold">Autentikasi Gagal</p>
                                <p className="mt-0.5 text-xs text-rose-400/90">{decodeURIComponent(errorMessage)}</p>
                            </div>
                        </div>
                    )}

                    {/* Google OAuth Trigger Button */}
                    <div className="space-y-4">
                        <GoogleLoginButton redirectTo={redirectTo} />

                        <div className="relative flex items-center justify-center my-4">
                            <div className="border-t border-zinc-800 w-full" />
                            <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 uppercase tracking-widest absolute">
                                OAuth 2.0
                            </span>
                        </div>

                        <p className="text-center text-xs text-zinc-500 leading-relaxed">
                            Pastikan Anda menggunakan akun Google yang terdaftar sebagai panitia/admin turnamen.
                        </p>
                    </div>
                </Card>

                {/* Back to Public Link */}
                <div className="text-center">
                    <Link
                        href="/register"
                        className="text-xs text-zinc-400 hover:text-lime-400 transition inline-flex items-center gap-1.5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Halaman Pendaftaran Peserta</span>
                    </Link>
                </div>
            </div>
        </main>
    )
}
