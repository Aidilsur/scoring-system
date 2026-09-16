import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourtSelectionView } from '@/components/scoring/CourtSelectionView'

export const metadata: Metadata = {
    title: 'Pilih Court — Scoring — Padel Tournament',
    description: 'Pilih court turnamen padel untuk memulai live scoring.',
}

export default async function AdminScoringPage() {
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

    return <CourtSelectionView isReferee={isReferee} />
}
