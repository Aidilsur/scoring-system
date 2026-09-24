import React from 'react'

export interface HomeFooterSectionProps {
    tournamentName: string
}

export function HomeFooterSection({ tournamentName }: HomeFooterSectionProps) {
    const currentYear = new Date().getFullYear()

    return (
        <footer
            id="footer"
            className="w-full snap-start snap-always py-12 sm:py-16 px-6 sm:px-12 lg:px-20 relative bg-zinc-950 text-zinc-100 border-t border-zinc-900 overflow-hidden"
        >
            {/* Subtle Accent Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-lime-400/[0.015] rounded-full blur-[80px] pointer-events-none" />

            <div className="max-w-6xl mx-auto flex flex-col items-start lg:items-center text-left lg:text-center space-y-4 relative z-10">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono tracking-widest text-lime-500/50 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-500/50" />
                    <span>Official System</span>
                </div>

                <h2 className="font-[family-name:var(--font-anton)] text-xl sm:text-2xl uppercase tracking-wider text-zinc-400">
                    {tournamentName} &copy; {currentYear}
                </h2>

                <p className="text-xs sm:text-sm text-zinc-600 font-mono tracking-wide uppercase">
                    Built with Padel Sport Technology
                </p>
            </div>
        </footer>
    )
}
