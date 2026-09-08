import React from 'react'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import TournamentRegistrationForm, {
    ActiveCategory,
} from '@/components/registration/TournamentRegistrationForm'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
    title: 'Pendaftaran Peserta Turnamen Padel',
    description:
        'Daftarkan tim Anda untuk turnamen padel resmi. Pilih kategori, isi data pasangan, dan unggah bukti pembayaran.',
}

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
    const supabase = await createClient()

    // Fetch kategori turnamen yang sedang aktif
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, partner_type, level, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching categories for registration:', error.message)
    }

    const categories: ActiveCategory[] = (data || []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        partner_type: cat.partner_type,
        level: cat.level,
    }))

    return (
        <main className="min-h-screen bg-linear-to-b from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
            <div className="w-full max-w-xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8 sm:mb-10 space-y-3">
                    <Badge variant="success" size="md">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Pendaftaran Dibuka
                    </Badge>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                        Padel Tournament Registration
                    </h1>

                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                        Lengkapi formulir di bawah ini untuk mendaftarkan tim Anda. Pastikan data pasangan dan bukti transfer valid untuk diverifikasi panitia.
                    </p>
                </div>

                {/* Banner jika belum ada kategori aktif di DB */}
                {categories.length === 0 && (
                    <div className="mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-semibold">Pemberitahuan</p>
                            <p className="mt-0.5">
                                Belum ada kategori turnamen yang aktif di database. Silakan tambahkan data kategori di database Supabase terlebih dahulu agar pendaftaran dapat dipilih.
                            </p>
                        </div>
                    </div>
                )}

                {/* Client Component Form */}
                <TournamentRegistrationForm categories={categories} />

                {/* Footer Notes */}
                <div className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                    <p>Padel Tournament Scoring System &copy; {new Date().getFullYear()}</p>
                    <p>Butuh bantuan pendaftaran? Hubungi panitia via WhatsApp.</p>
                </div>
            </div>
        </main>
    )
}
