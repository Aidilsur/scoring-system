'use client'

import React from 'react'
import {
    TextInput,
    SelectInput,
    FileInput,
    Button,
    Card,
} from '@/components/ui'
import { useTeamRegistration } from '@/hooks/useTeamRegistration'
import { formatCategoryBadge } from '@/utils/format'

export interface ActiveCategory {
    id: string
    name: string
    partner_type: 'fix' | 'mix' | string
    level: 'beginner' | 'lower_bronze' | 'bronze' | string
}

interface TournamentRegistrationFormProps {
    categories: ActiveCategory[]
}

interface RegistrationNextStep {
    id: string
    text: string
    highlight?: string
}

const REGISTRATION_NEXT_STEPS: readonly RegistrationNextStep[] = [
    {
        id: 'verify-payment',
        text: 'Panitia akan memverifikasi bukti pembayaran Anda.',
    },
    {
        id: 'pending-status',
        text: 'Status tim Anda saat ini adalah pending.',
        highlight: 'pending',
    },
    {
        id: 'group-draw',
        text: 'Setelah dikonfirmasi, tim Anda akan masuk ke drawing grup turnamen.',
    },
] as const

/**
 * TournamentRegistrationForm
 * Formulir pendaftaran tim peserta turnamen padel (Presentational / Composition Component).
 * Menggunakan komponen atomic di components/ui/ dan state logic dari useTeamRegistration.
 */
export default function TournamentRegistrationForm({
    categories,
}: TournamentRegistrationFormProps) {
    const {
        isSubmitting,
        response,
        errors,
        selectedFile,
        filePreview,
        formRef,
        fileInputRef,
        handleFileChange,
        removeFile,
        resetSuccessState,
        handleSubmit,
    } = useTeamRegistration()

    // Jika pendaftaran turnamen berhasil, tampilkan konfirmasi sukses
    if (response?.success) {
        return (
            <Card variant="default" className="border-emerald-500/30 text-center shadow-emerald-500/5">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                    Pendaftaran Berhasil Terkirim!
                </h3>
                <p className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-6">
                    {response.message}
                </p>

                <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 mb-8 max-w-md mx-auto text-left">
                    <p className="font-semibold mb-1 flex items-center gap-1.5">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Langkah Selanjutnya:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-emerald-700/90 dark:text-emerald-400/90">
                        {REGISTRATION_NEXT_STEPS.map((step) => (
                            <li key={step.id}>
                                {step.highlight ? (
                                    <>
                                        Status tim Anda saat ini adalah{' '}
                                        <strong className="font-semibold">{step.highlight}</strong>.
                                    </>
                                ) : (
                                    step.text
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <Button type="button" variant="primary" onClick={resetSuccessState}>
                    Daftarkan Tim Lain
                </Button>
            </Card>
        )
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <Card variant="elevated" className="space-y-7">
                {/* Banner Error Global jika submit gagal */}
                {response && !response.success && (
                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 text-rose-800 dark:text-rose-300 text-sm flex items-start gap-3">
                        <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-semibold">Gagal Mengirim Pendaftaran</p>
                            <p className="mt-0.5 text-xs sm:text-sm text-rose-700/90 dark:text-rose-400">
                                {response.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Section 1: Kategori Kelas Turnamen */}
                <SelectInput
                    id="category_id"
                    name="category_id"
                    label="Kategori Kelas Turnamen"
                    required
                    defaultValue=""
                    disabled={isSubmitting || categories.length === 0}
                    error={errors.category_id}
                    helperText="Pilih kategori yang sesuai dengan pasangan dan skill level Anda."
                    placeholder={
                        categories.length === 0
                            ? 'Belum ada kategori yang dibuka saat ini'
                            : '-- Pilih Kategori Turnamen --'
                    }
                    options={categories.map((cat) => ({
                        value: cat.id,
                        label: `${cat.name} (${formatCategoryBadge(cat.partner_type, cat.level)})`,
                    }))}
                />

                {/* Section 2: Data Pemain */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Informasi Pasangan Pemain
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <TextInput
                            id="player1_name"
                            name="player1_name"
                            label="Nama Pemain 1"
                            required
                            placeholder="Contoh: Budi Santoso"
                            disabled={isSubmitting}
                            error={errors.player1_name}
                        />

                        <TextInput
                            id="player2_name"
                            name="player2_name"
                            label="Nama Pemain 2 (Partner)"
                            required
                            placeholder="Contoh: Andi Pratama"
                            disabled={isSubmitting}
                            error={errors.player2_name}
                        />
                    </div>
                </div>

                {/* Section 3: Kontak & Komunitas */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Kontak & Akun Komunitas
                    </h4>

                    <div className="space-y-4">
                        <TextInput
                            id="phone_number"
                            name="phone_number"
                            type="tel"
                            label="Nomor WhatsApp / HP"
                            required
                            placeholder="081234567890"
                            disabled={isSubmitting}
                            error={errors.phone_number}
                            helperText="Digunakan panitia untuk konfirmasi dan pengumuman jadwal match."
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <TextInput
                                id="instagram_handle"
                                name="instagram_handle"
                                label="Akun Instagram"
                                required
                                placeholder="@username"
                                disabled={isSubmitting}
                                error={errors.instagram_handle}
                            />

                            <TextInput
                                id="reclub_handle"
                                name="reclub_handle"
                                label="Akun Reclub"
                                required
                                placeholder="Username Reclub"
                                disabled={isSubmitting}
                                error={errors.reclub_handle}
                            />
                        </div>
                    </div>
                </div>

                {/* Section 4: Bukti Pembayaran */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Bukti Pembayaran <span className="text-rose-500">*</span>
                    </h4>

                    <FileInput
                        ref={fileInputRef}
                        id="payment_proof"
                        name="payment_proof"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        disabled={isSubmitting}
                        error={errors.payment_proof}
                        helperText="Format file yang didukung: JPG, PNG, WEBP, atau PDF (maksimal 5MB)."
                        selectedFile={selectedFile}
                        filePreview={filePreview}
                        onFileChange={handleFileChange}
                        onRemoveFile={removeFile}
                    />
                </div>

                {/* Tombol Submit */}
                <div className="pt-4">
                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className="w-full"
                        isLoading={isSubmitting}
                        loadingText="Sedang Mengirim & Mengunggah Bukti..."
                    >
                        <span>Kirim Pendaftaran Tim</span>
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </Button>

                    <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-3">
                        Dengan mendaftar, Anda menyetujui jadwal dan peraturan resmi turnamen.
                    </p>
                </div>
            </Card>
        </form>
    )
}
