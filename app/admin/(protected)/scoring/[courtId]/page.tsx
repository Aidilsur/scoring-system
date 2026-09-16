import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourtMatchesView } from '@/components/scoring/CourtMatchesView'

interface CourtScoringPageProps {
    params: Promise<{ courtId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Jadwal Court — Scoring — Padel Tournament',
        description: 'Daftar jadwal pertandingan pada court untuk live scoring wasit.',
    }
}

export default async function CourtScoringPage({ params }: CourtScoringPageProps) {
    const { courtId } = await params
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/admin/login')
    }

    const email = user.email?.toLowerCase().trim() || ''
    const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', email)
        .maybeSingle()

    const isReferee = adminUser?.role === 'referee'

    return (
        <CourtMatchesView
            courtId={courtId}
            isReferee={isReferee}
            userEmail={email}
        />
    )
}
