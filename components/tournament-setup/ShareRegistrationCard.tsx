'use client'

import React, { useState, useEffect } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Check, Download, ExternalLink, QrCode, Share2 } from 'lucide-react'
import { Card, Button } from '@/components/ui'

export interface ShareRegistrationCardProps {
    tournamentName?: string
}

/**
 * ShareRegistrationCard
 * Komponen untuk menampilkan QR code dan tautan publik halaman pendaftaran turnamen (/register).
 * Menggunakan window.location.origin dinamis (mendukung localhost & production domain).
 * Dilengkapi fitur Copy Link dan Download QR Code sebagai file gambar PNG.
 */
export function ShareRegistrationCard({ tournamentName }: ShareRegistrationCardProps) {
    const [origin, setOrigin] = useState(() =>
        typeof window !== 'undefined' ? window.location.origin : ''
    )
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && !origin) {
            setOrigin(window.location.origin)
        }
    }, [origin])

    const registrationUrl = origin ? `${origin}/register` : ''
    const displayUrl = registrationUrl || 'Memuat URL pendaftaran...'

    const handleCopy = async () => {
        if (!registrationUrl) return
        try {
            await navigator.clipboard.writeText(registrationUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        } catch (err) {
            console.error('Gagal menyalin link:', err)
        }
    }

    const handleDownloadPng = () => {
        const canvas = document.getElementById('registration-qr-canvas') as HTMLCanvasElement
        if (!canvas) return

        const pngUrl = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        const sanitizedName = (tournamentName || 'padel-tournament')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
        downloadLink.download = `${sanitizedName}-registration-qr.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
    }

    return (
        <Card className="p-6 sm:p-8 space-y-6 !bg-emerald-900/80 !border-emerald-800 rounded-xl shadow-xl shadow-emerald-950/60 text-white">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800/80">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-lime-400 uppercase tracking-wider">
                        <Share2 className="w-3.5 h-3.5 text-lime-400" />
                        <span>Akses Publik Peserta</span>
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">
                        Bagikan Pendaftaran
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-300/90">
                        Cetak atau bagikan QR code dan tautan langsung ke calon peserta untuk mengisi form pendaftaran tim.
                    </p>
                </div>

                {registrationUrl && (
                    <a
                        href={registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-lime-400 transition-colors font-semibold py-1 px-2.5 rounded-lg border border-emerald-800/80 hover:border-lime-400/50 bg-emerald-950/60"
                    >
                        <span>Buka Halaman</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}
            </div>

            {/* Content: QR Code & Link Controls */}
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                {/* QR Code Container with High Contrast White Background for Easy Phone Scanning */}
                <div className="shrink-0 flex flex-col items-center">
                    <div className="bg-white p-3.5 rounded-2xl shadow-xl shadow-black/50 ring-4 ring-white/10 flex items-center justify-center">
                        {registrationUrl ? (
                            <QRCodeCanvas
                                id="registration-qr-canvas"
                                value={registrationUrl}
                                size={180}
                                level="H"
                                bgColor="#ffffff"
                                fgColor="#09090b"
                                includeMargin={true}
                            />
                        ) : (
                            <div className="w-[180px] h-[180px] flex items-center justify-center bg-zinc-100 rounded-xl text-zinc-500 text-xs font-mono">
                                Menyiapkan QR...
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] text-emerald-300/80 font-mono mt-2.5 flex items-center gap-1">
                        <QrCode className="w-3 h-3 text-lime-400" />
                        Scan via Kamera HP
                    </p>
                </div>

                {/* Details and Actions Column */}
                <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300">
                            Tautan Formulir Pendaftaran
                        </label>
                        {/* URL Display Box */}
                        <div className="flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl !bg-emerald-950/90 !border !border-emerald-800/90 font-mono text-xs text-white break-all select-all shadow-inner">
                            <span className="truncate">{displayUrl}</span>
                        </div>
                        <p className="text-[11px] text-emerald-400/80">
                            Tautan ini otomatis menyesuaikan domain aktif ({origin || 'host'}).
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        {/* Copy Link Button */}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCopy}
                            disabled={!registrationUrl}
                            className="bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-700 text-emerald-100 text-xs sm:text-sm font-bold rounded-xl px-5 py-2.5 flex items-center gap-2 transition-all cursor-pointer"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-lime-400" />
                                    <span className="text-lime-300">Link Tersalin!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 text-lime-400" />
                                    <span>Salin Link</span>
                                </>
                            )}
                        </Button>

                        {/* Download QR PNG Button */}
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleDownloadPng}
                            disabled={!registrationUrl}
                            className="!bg-lime-400 hover:!bg-lime-300 !text-zinc-950 text-xs sm:text-sm !font-black tracking-wide rounded-xl px-5 py-2.5 shadow-lg shadow-lime-400/20 active:scale-[0.99] flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download QR (PNG)</span>
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}
