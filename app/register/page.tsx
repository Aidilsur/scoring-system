import React from 'react'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import TournamentRegistrationForm, {
    ActiveCategory,
} from '@/components/registration/TournamentRegistrationForm'
import { Badge } from '@/components/ui/Badge'
import { AlertTriangle } from 'lucide-react'

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
        <main className="min-h-screen bg-zinc-950 text-zinc-100 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Ambient Sports Undertone Blur */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-xl mx-auto relative z-10">
                {/* Header Section */}
                <div className="text-center mb-8 sm:mb-10 space-y-3">
                    <Badge variant="success" size="md">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                        Pendaftaran Dibuka
                    </Badge>

                    <h1 className="font-[family-name:var(--font-anton)] text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-white">
                        Padel Tournament Registration
                    </h1>

                    <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
                        Lengkapi formulir di bawah ini untuk mendaftarkan tim Anda. Pastikan data pasangan dan bukti transfer valid untuk diverifikasi panitia.
                    </p>
                </div>

                {/* Banner jika belum ada kategori aktif di DB */}
                {categories.length === 0 && (
                    <div className="mb-6 bg-amber-950/40 border border-amber-900/60 rounded-2xl p-4 text-amber-300 text-xs sm:text-sm flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-amber-200">Pemberitahuan</p>
                            <p className="mt-0.5 text-amber-300/90">
                                Belum ada kategori turnamen yang aktif di database. Silakan tambahkan data kategori di database Supabase terlebih dahulu agar pendaftaran dapat dipilih.
                            </p>
                        </div>
                    </div>
                )}

                {/* Client Component Form */}
                <TournamentRegistrationForm categories={categories} />

                {/* Footer Notes */}
                <div className="mt-8 text-center text-xs text-zinc-500 space-y-1">
                    <p>Padel Tournament Scoring System &copy; {new Date().getFullYear()}</p>
                    <p>Butuh bantuan pendaftaran? Hubungi panitia via WhatsApp.</p>
                </div>
            </div>
        </main>
    )
}
