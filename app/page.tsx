import React from 'react'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { HomeView } from '@/components/home'

export const metadata: Metadata = {
    title: 'Padel Tournament Scoring System — Sport Technology',
    description:
        'Sistem manajemen turnamen padel end-to-end: pendaftaran peserta, drawing otomatis, live score layar TV, klasemen real-time, dan bagan knockout.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    const supabase = await createClient()

    // Ambil nama turnamen aktif dari tournament_settings
    const { data: settings } = await supabase
        .from('tournament_settings')
        .select('name')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const tournamentName = settings?.name || 'JAKARTA PADEL OPEN 2026'

    return <HomeView tournamentName={tournamentName} />
}
