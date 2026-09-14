import React from 'react'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CourtLiveDisplay } from '@/components/display/CourtLiveDisplay'

interface CourtDisplayPageProps {
    params: Promise<{ courtId: string }>
}

export async function generateMetadata({
    params,
}: CourtDisplayPageProps): Promise<Metadata> {
    const { courtId } = await params
    const supabase = await createClient()

    const { data: court } = await supabase
        .from('courts')
        .select('name')
        .eq('id', courtId)
        .maybeSingle()

    const courtTitle = court?.name || 'Court'

    return {
        title: `${courtTitle} — Live Score Display — Padel Tournament`,
        description: `Papan skor langsung (live score broadcast) untuk ${courtTitle}. Dioptimalkan untuk layar TV dan monitor court.`,
    }
}

/**
 * Public TV / Court Monitor Live Score Display
 * Rute publik, tanpa autentikasi, realtime subscription otomatis.
 */
export default async function CourtDisplayPage({ params }: CourtDisplayPageProps) {
    const { courtId } = await params

    return <CourtLiveDisplay courtId={courtId} />
}
