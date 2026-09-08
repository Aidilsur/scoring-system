import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamsManagementView } from '@/components/teams/TeamsManagementView'

export const metadata: Metadata = {
    title: 'Kelola & Verifikasi Peserta — Admin Padel Tournament',
    description: 'Verifikasi bukti pembayaran pendaftaran tim padel dan kelola status peserta.',
}

export const dynamic = 'force-dynamic'

export default async function AdminTeamsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/admin/login')
    }

    return (
        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                <TeamsManagementView />
            </div>
        </div>
    )
}
