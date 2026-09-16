import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MatchScoringView } from '@/components/scoring/MatchScoringView'

interface MatchScoringPageProps {
    params: Promise<{ courtId: string; matchId: string }>
}

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Live Scoring — Padel Tournament',
        description: 'Pencatatan skor live pertandingan padel turnamen.',
    }
}

export default async function MatchScoringPage({ params }: MatchScoringPageProps) {
    const { courtId, matchId } = await params
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
        <MatchScoringView
            courtId={courtId}
            matchId={matchId}
            isReferee={isReferee}
            userEmail={email}
        />
    )
}
