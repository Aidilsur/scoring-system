import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Zap, ArrowLeft, Clock, ShieldCheck } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
    title: 'Live Scoring — Padel Tournament',
    description: 'Modul pencatatan skor pertandingan langsung per court untuk wasit dan panitia.',
}

export default async function AdminScoringPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/admin/login')
    }

    const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', user.email?.toLowerCase().trim() || '')
        .maybeSingle()

    const isReferee = adminUser?.role === 'referee'

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header & Breadcrumb */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                            {!isReferee && (
                                <>
                                    <Link href="/admin" className="hover:text-lime-400 transition-colors">
                                        Admin
                                    </Link>
                                    <span>/</span>
                                </>
                            )}
                            <span className="text-zinc-200 font-medium">Live Scoring</span>
                        </div>
                        <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl text-white uppercase tracking-tight flex items-center gap-2.5">
                            <Zap className="w-8 h-8 text-lime-400 fill-lime-400/20" />
                            Live Scoring Pertandingan
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1">
                            Portal wasit untuk memilih court dan menginput skor real-time pertandingan padel.
                        </p>
                    </div>

                    <div>
                        <Badge variant={isReferee ? 'warning' : 'success'} size="md">
                            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                            {isReferee ? 'Akses Wasit' : 'Akses Administrator'}
                        </Badge>
                    </div>
                </div>

                {/* Info Card */}
                <Card className="p-8 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 text-lime-400 flex items-center justify-center mx-auto">
                        <Clock className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                            Modul Scoring Siap Dihubungkan
                        </h3>
                        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                            Alur otentikasi role Wasit telah aktif. Halaman antarmuka live scoring (pemilihan court aktif dan tombol input poin 15/30/40/Golden Point) akan dibangun pada tahap berikutnya sesuai spesifikasi §6.
                        </p>
                    </div>

                    {!isReferee && (
                        <div className="pt-2">
                            <Link href="/admin">
                                <Button variant="secondary" size="sm" className="rounded-xl inline-flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Kembali ke Dashboard Admin
                                </Button>
                            </Link>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
