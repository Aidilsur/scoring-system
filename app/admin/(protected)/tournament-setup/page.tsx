import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TournamentSetupView } from '@/components/tournament-setup/TournamentSetupView'
import { TournamentSettings } from '@/types/domain'

export const metadata: Metadata = {
    title: 'Setup Turnamen — Admin Padel Tournament',
    description: 'Konfigurasi parameter turnamen, format grup, jumlah court, dan aturan scoring.',
}

export const dynamic = 'force-dynamic'

export default async function TournamentSetupPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/admin/login')
    }

    // Ambil data pengaturan turnamen yang aktif jika sudah ada (mode edit)
    const { data: initialSettings } = await supabase
        .from('tournament_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8 relative overflow-hidden">
            {/* Subtle Ambient Glows */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <TournamentSetupView initialData={initialSettings as TournamentSettings | null} />
            </div>
        </div>
    )
}
