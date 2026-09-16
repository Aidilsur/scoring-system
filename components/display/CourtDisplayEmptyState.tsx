import React from 'react'
import { Layers, Maximize, Minimize } from 'lucide-react'
import { PadelCourtGeometry } from './PadelCourtGeometry'

interface CourtDisplayEmptyStateProps {
    courtName: string
    currentTime: string
    isFullscreen: boolean
    onToggleFullscreen: () => void
}

/**
 * CourtDisplayEmptyState
 * Tampilan kosong ketika belum ada match aktif maupun terjadwal di court terkait.
 * Menampilkan ambient padel geometry, jam digital broadcast, dan status standby realtime.
 */
export function CourtDisplayEmptyState({
    courtName,
    currentTime,
    isFullscreen,
    onToggleFullscreen,
}: CourtDisplayEmptyStateProps) {
    return (
        <div
            className="min-h-screen h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-6 sm:p-10 md:p-14 relative overflow-hidden select-none"
        >
            <PadelCourtGeometry />

            {/* Header */}
            <div
                className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-4"
            >
                <div>
                    <span className="text-xs font-mono text-lime-400 uppercase tracking-widest font-bold">
                        TV DISPLAY LAPANGAN
                    </span>
                    <h1
                        className="text-3xl sm:text-4xl font-[family-name:var(--font-anton)] text-white uppercase tracking-tight"
                    >
                        {courtName}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span
                        className="text-sm sm:text-base font-mono font-bold text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800"
                    >
                        {currentTime}
                    </span>
                    <button
                        type="button"
                        onClick={onToggleFullscreen}
                        title="Layar Penuh (F11)"
                        className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        {isFullscreen ? (
                            <Minimize className="w-5 h-5" />
                        ) : (
                            <Maximize className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Center Empty Message */}
            <div
                className="relative z-10 max-w-lg mx-auto text-center space-y-5 p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-2xl backdrop-blur-md"
            >
                <div
                    className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto border border-zinc-700/50 shadow-inner"
                >
                    <Layers className="w-8 h-8 text-lime-400/80" />
                </div>
                <div className="space-y-2">
                    <h2
                        className="text-2xl sm:text-3xl font-[family-name:var(--font-anton)] text-white uppercase tracking-wider"
                    >
                        Belum Ada Pertandingan di Court Ini
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
                        Jadwal pertandingan akan otomatis muncul di layar ini setelah ditetapkan
                        atau dimulai oleh panitia turnamen.
                    </p>
                </div>
                <div className="pt-2">
                    <span
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700"
                    >
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
                        STANDBY REALTIME
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div
                className="relative z-10 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/80 pt-4 font-mono"
            >
                <span>PADEL TOURNAMENT SCORING SYSTEM</span>
                <span>LIVE TV BROADCAST</span>
            </div>
        </div>
    )
}
