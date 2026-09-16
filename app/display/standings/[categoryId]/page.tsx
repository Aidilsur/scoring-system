import React from 'react'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { CategoryStandingsView } from '@/components/display/CategoryStandingsView'

interface StandingsPageProps {
    params: Promise<{ categoryId: string }>
}

export async function generateMetadata({
    params,
}: StandingsPageProps): Promise<Metadata> {
    const { categoryId } = await params
    const supabase = await createClient()

    const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', categoryId)
        .maybeSingle()

    const categoryTitle = category?.name || 'Klasemen'

    return {
        title: `${categoryTitle} — Klasemen Grup — Padel Tournament`,
        description: `Tabel klasemen fase grup turnamen padel kategori ${categoryTitle}. Pembaruan poin dan peringkat real-time.`,
    }
}

/**
 * Public Group Standings Display (/display/standings/[categoryId])
 * Halaman publik, tanpa autentikasi, mengikutsertakan Realtime subscription otomatis.
 * Dioptimalkan untuk TV display (16:9) dan monitor informasi penonton.
 */
export default async function StandingsPage({ params }: StandingsPageProps) {
    const { categoryId } = await params

    return <CategoryStandingsView categoryId={categoryId} />
}
