import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, Badge } from '@/components/ui'
import { LogoutButton } from '@/components/admin/LogoutButton'
import { AdminRole } from '@/types/domain'
import {
    Layers,
    Users,
    SlidersHorizontal,
    Shuffle,
    CalendarDays,
    Zap,
    ArrowRight,
    ShieldCheck,
    Trophy,
} from 'lucide-react'

export const metadata: Metadata = {
    title: 'Admin Dashboard — Padel Tournament',
    description: 'Dashboard pengelolaan turnamen padel, live score, dan drawing.',
}

export const dynamic = 'force-dynamic'

// Menu modul admin yang akan diimplementasikan sesuai §6.2 (Module-level constant sesuai docs/component-architecture.md §G & §H)
const ADMIN_MODULES = [
    {
        title: 'Kategori Turnamen',
        path: '/admin/categories',
        description: 'Kelola kelas kategori (tipe partner × skill level)',
        badge: 'Prasyarat',
        icon: Layers,
    },
    {
        title: 'Verifikasi Peserta',
        path: '/admin/teams',
        description: 'Kelola tim pendaftar & verifikasi bukti pembayaran',
        badge: 'Pending Review',
        icon: Users,
    },
    {
        title: 'Setup Turnamen',
        path: '/admin/tournament-setup',
        description: 'Atur jumlah court, ukuran grup, & golden point',
        badge: 'Konfigurasi',
        icon: SlidersHorizontal,
    },
    {
        title: 'Drawing Grup',
        path: '/admin/draw',
        description: 'Generate & acak pembagian grup per kategori',
        badge: 'Otomatis',
        icon: Shuffle,
    },
    {
        title: 'Jadwal Pertandingan',
        path: '/admin/schedule',
        description: 'Penjadwalan otomatis round-robin per court & jam',
        badge: 'Multi-Court',
        icon: CalendarDays,
    },
    {
        title: 'Live Scoring (Hari-H)',
        path: '/admin/scoring',
        description: 'Pilih court aktif dan input skor poin langsung',
        badge: 'Prioritas Utama',
        icon: Zap,
    },
    {
        title: 'Bracket Knockout',
        path: '/admin/bracket',
        description: 'Generate & pantau bagan semifinal sistem gugur',
        badge: 'Fase Knockout',
        icon: Trophy,
    },
]

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/admin/login')
    }

    const userEmail = user.email?.toLowerCase().trim() || ''
    const { data: adminUserData } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', userEmail)
        .maybeSingle()

    const role: AdminRole = (adminUserData?.role as AdminRole) || 'admin'
    const isReferee = role === 'referee'

    const adminName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        (isReferee ? 'Wasit' : 'Administrator')
    const adminEmail = user.email || 'Email tidak tersedia'
    const adminAvatar = user.user_metadata?.avatar_url

    const displayedModules = isReferee
        ? ADMIN_MODULES.filter((m) => m.path === '/admin/scoring')
        : ADMIN_MODULES

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
            {/* Top Navbar */}
            <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-lime-400/15 border border-lime-400/30 flex items-center justify-center text-lime-400 font-extrabold text-sm">
                        PT
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                            Padel Scoring System
                        </h2>
                        <p className="text-[11px] text-zinc-400">
                            {isReferee ? 'Referee Portal' : 'Admin Control Center'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-800/70 border border-zinc-700/60 text-xs text-zinc-300">
                        {adminAvatar ? (
                            <img
                                src={adminAvatar}
                                alt={adminName}
                                className="w-5 h-5 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center text-[10px] font-bold">
                                {adminName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="font-medium max-w-[140px] truncate">{adminName}</span>
                        <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                                isReferee
                                    ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                    : 'bg-lime-400/20 text-lime-300 border-lime-400/40'
                            }`}
                        >
                            {isReferee ? 'Wasit' : 'Admin'}
                        </span>
                    </div>

                    <LogoutButton variant="secondary" size="sm" />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
                {/* Welcome Card */}
                <Card variant="elevated" className="bg-zinc-900/80 border-zinc-800 relative overflow-hidden p-6 sm:p-8">
                    <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                        <div className="space-y-1.5">
                            <Badge variant={isReferee ? 'warning' : 'success'} size="sm">
                                {isReferee ? 'Sesi Wasit Aktif' : 'Sesi Administrator Aktif'}
                            </Badge>
                            <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl lg:text-5xl text-white uppercase tracking-tight">
                                Selamat Datang, {adminName}!
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-400">
                                Berhasil login sebagai: <span className="text-zinc-200 font-mono">{adminEmail}</span>
                            </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                            <Link
                                href="/register"
                                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 transition"
                            >
                                Halaman Pendaftaran Publik
                            </Link>
                        </div>
                    </div>
                </Card>

                {/* Section Modul Admin */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                            {isReferee ? 'Modul Operasional Wasit' : 'Modul Pengelolaan Turnamen'}
                        </h3>
                        <span className="text-[11px] text-zinc-500">
                            {isReferee ? 'Akses Khusus Pertandingan Langsung' : 'Berdasarkan Spesifikasi §6.2'}
                        </span>
                    </div>

                    <div
                        className={`grid grid-cols-1 ${
                            isReferee
                                ? 'sm:grid-cols-1 max-w-sm'
                                : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
                        } gap-4`}
                    >
                        {displayedModules.map((module) => {
                            const isAvailable =
                                module.path === '/admin/categories' ||
                                module.path === '/admin/teams' ||
                                module.path === '/admin/tournament-setup' ||
                                module.path === '/admin/draw' ||
                                module.path === '/admin/schedule' ||
                                module.path === '/admin/scoring'
                            return (
                                <Link
                                    key={module.path}
                                    href={isAvailable ? module.path : '#'}
                                    className={`bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition space-y-3 group block ${
                                        !isAvailable ? 'cursor-default' : 'hover:border-lime-400/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800/90 border border-zinc-700/60 text-lime-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                                            <module.icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md border border-zinc-700/40">
                                            {module.badge}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-white group-hover:text-lime-400 transition">
                                            {module.title}
                                        </h4>
                                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                            {module.description}
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <span className="text-[11px] font-semibold text-lime-400 inline-flex items-center gap-1">
                                            {isAvailable ? 'Buka Modul' : 'Segera Hadir'}
                                            <ArrowRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Session Diagnostic & Info Card */}
                <Card variant="bordered" className="bg-zinc-900/40 border border-zinc-800 p-5 text-xs text-zinc-400 space-y-2">
                    <p className="font-semibold text-zinc-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-lime-400" />
                        Sistem Proteksi Middleware Berjalan Normal
                    </p>
                    <p>
                        Seluruh rute di bawah <code className="text-lime-400 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">/admin/*</code> telah diproteksi oleh middleware Supabase Auth. Sesi Anda akan otomatis di-refresh pada setiap navigasi request.
                    </p>
                </Card>
            </main>
        </div>
    )
}
