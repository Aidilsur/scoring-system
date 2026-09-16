import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BracketManagementView } from '@/components/bracket'

export const metadata: Metadata = {
    title: 'Bracket Knockout — Admin Padel Tournament',
    description:
        'Generate dan kelola pasangan bracket babak semifinal sistem gugur per kategori turnamen padel.',
}

export const dynamic = 'force-dynamic'

export default async function AdminBracketPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/admin/login')
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 md:p-8">
            <div className="max-w-6xl mx-auto">
                <BracketManagementView />
            </div>
        </div>
    )
}
