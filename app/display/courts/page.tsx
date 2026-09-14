import React from 'react'
import { Metadata } from 'next'
import { CourtsOverviewGrid } from '@/components/display/CourtsOverviewGrid'

export const metadata: Metadata = {
    title: 'Multi-Court Monitor — Live Score Overview — Padel Tournament',
    description:
        'Pantau skor langsung (live scores) seluruh lapangan turnamen padel secara real-time. Informasi pertandingan aktif, jadwal laga berikutnya, dan status lapangan.',
}

/**
 * Public Multi-Court Overview Display (/display/courts)
 * Halaman publik, tanpa autentikasi, mengikutsertakan Realtime subscription otomatis untuk semua lapangan.
 */
export default function CourtsOverviewPage() {
    return <CourtsOverviewGrid />
}
