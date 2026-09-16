import React from 'react'
import { Metadata } from 'next'
import { StandingsOverviewGrid } from '@/components/display/StandingsOverviewGrid'

export const metadata: Metadata = {
    title: 'Standings Hub — Klasemen Seluruh Kategori — Padel Tournament',
    description:
        'Pusat pemantauan klasemen fase grup turnamen padel per kategori secara real-time. Informasi juara grup sementara, jumlah tim, dan statistik poin laga.',
}

export const dynamic = 'force-dynamic'

/**
 * Public Multi-Category Standings Hub (/display/standings)
 * Halaman publik, tanpa login, mengikutsertakan Realtime subscription otomatis.
 * Menampilkan grid kartu per kategori aktif dengan preview pemimpin grup sementara.
 */
export default function StandingsOverviewPage() {
    return <StandingsOverviewGrid />
}
