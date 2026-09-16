'use client'

import React from 'react'
import {
    Check,
    Info,
    AlertCircle,
    Users,
    Phone,
    Receipt,
    ArrowRight,
} from 'lucide-react'
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
            <Card variant="elevated" className="border-lime-400/30 text-center shadow-2xl">
                <div
                    className={
                        'w-16 h-16 bg-lime-400/15 border border-lime-400/30 text-lime-400 ' +
                        'rounded-full flex items-center justify-center mx-auto mb-5 ' +
                        'ring-8 ring-lime-400/10'
                    }
                >
                    <Check className="w-8 h-8" />
                </div>

                <h3
                    className={
                        'font-[family-name:var(--font-anton)] text-2xl sm:text-3xl ' +
                        'uppercase tracking-tight text-white mb-2'
                    }
                >
                    Pendaftaran Berhasil Terkirim!
                </h3>
                <p
                    className={
                        'text-zinc-300 text-sm sm:text-base leading-relaxed ' +
                        'max-w-md mx-auto mb-6'
                    }
                >
                    {response.message}
                </p>

                <div
                    className={
                        'bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 ' +
                        'text-xs sm:text-sm text-zinc-300 mb-8 max-w-md mx-auto text-left'
                    }
                >
                    <p
                        className={
                            'font-bold text-lime-400 uppercase tracking-wider mb-1.5 ' +
                            'flex items-center gap-1.5 text-xs'
                        }
                    >
                        <Info className="w-4 h-4 shrink-0" />
                        Langkah Selanjutnya:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 pl-1 text-zinc-400">
                        {REGISTRATION_NEXT_STEPS.map((step) => (
                            <li key={step.id}>
                                {step.highlight ? (
                                    <>
                                        Status tim Anda saat ini adalah{' '}
                                        <strong className="font-bold text-amber-300">
                                            {step.highlight}
                                        </strong>
                                        .
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
                    <div
                        className={
                            'bg-rose-950/40 border border-rose-900/60 rounded-2xl ' +
                            'p-4 text-rose-300 text-sm flex items-start gap-3'
                        }
                    >
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-rose-200">
                                Gagal Mengirim Pendaftaran
                            </p>
                            <p className="mt-0.5 text-xs sm:text-sm text-rose-400">
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
                <div className="pt-2 border-t border-zinc-800">
                    <h4
                        className={
                            'text-xs font-bold uppercase tracking-wider text-lime-400 ' +
                            'mb-4 flex items-center gap-1.5'
                        }
                    >
                        <Users className="w-4 h-4" />
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
                <div className="pt-2 border-t border-zinc-800">
                    <h4
                        className={
                            'text-xs font-bold uppercase tracking-wider text-lime-400 ' +
                            'mb-4 flex items-center gap-1.5'
                        }
                    >
                        <Phone className="w-4 h-4" />
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
                            helperText={
                                'Digunakan panitia untuk konfirmasi dan ' +
                                'pengumuman jadwal match.'
                            }
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
                <div className="pt-2 border-t border-zinc-800">
                    <h4
                        className={
                            'text-xs font-bold uppercase tracking-wider text-lime-400 ' +
                            'mb-2 flex items-center gap-1.5'
                        }
                    >
                        <Receipt className="w-4 h-4" />
                        Bukti Pembayaran <span className="text-rose-500">*</span>
                    </h4>

                    <FileInput
                        ref={fileInputRef}
                        id="payment_proof"
                        name="payment_proof"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        disabled={isSubmitting}
                        error={errors.payment_proof}
                        helperText={
                            'Format file yang didukung: JPG, PNG, WEBP, atau PDF ' +
                            '(maksimal 5MB).'
                        }
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
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <p className="text-center text-[11px] text-zinc-500 mt-3">
                        Dengan mendaftar, Anda menyetujui jadwal dan peraturan resmi turnamen.
                    </p>
                </div>
            </Card>
        </form>
    )
}
