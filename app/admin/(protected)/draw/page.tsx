import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DrawManagementView } from '@/components/draw'

export const metadata: Metadata = {
  title: 'Drawing Grup & Jadwal — Admin Padel Tournament',
  description:
    'Generate dan kelola pembagian grup serta jadwal pertandingan round robin per kategori.',
}

export const dynamic = 'force-dynamic'

export default async function AdminDrawPage() {
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
        <DrawManagementView />
      </div>
    </div>
  )
}
