import React from 'react'
import { Layers, Info, Workflow, Compass, ChevronDown, ArrowUp } from 'lucide-react'

export interface HomeSectionPlaceholderProps {
    id: string
    sectionIndex: number
    totalSections: number
    title: string
    category: string
    description: string
    nextSectionId?: string
}

function getSectionIcon(id: string) {
    switch (id) {
        case 'categories':
            return Layers
        case 'tournament-info':
            return Info
        case 'how-it-works':
            return Workflow
        case 'footer':
        default:
            return Compass
    }
}

/**
 * HomeSectionPlaceholder
 * Presentational dumb component for placeholder sections (2 - 5).
 * Styled with zinc-950 dark background and subtle lime/emerald undertones.
 */
export function HomeSectionPlaceholder({
    id,
    sectionIndex,
    totalSections,
    title,
    category,
    description,
    nextSectionId,
}: HomeSectionPlaceholderProps) {
    const Icon = getSectionIcon(id)
    const formattedIndex = String(sectionIndex).padStart(2, '0')
    const formattedTotal = String(totalSections).padStart(2, '0')

    return (
        <section
            id={id}
            className="h-screen min-h-screen w-full snap-start snap-always flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-10 relative overflow-hidden bg-zinc-950 text-zinc-100 border-t border-zinc-900"
        >
            {/* Ambient Background Accent */}
            <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
                <div className="w-[85vw] max-w-5xl h-[70vh] border border-zinc-700 rounded-3xl" />
            </div>

            {/* Section Header Top Tag */}
            <div className="w-full flex items-center justify-between relative z-10">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-lime-400">
                    <span>SECTION</span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {formattedIndex} / {formattedTotal}
                    </span>
                </div>

                <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono font-semibold">
                    {category}
                </span>
            </div>

            {/* Section Main Content Box */}
            <div className="w-full max-w-2xl mx-auto text-center flex flex-col items-center justify-center my-auto relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lime-400 shadow-xl shadow-black/40">
                    <Icon className="w-8 h-8" />
                </div>

                <div className="space-y-3">
                    <h2 className="font-[family-name:var(--font-anton)] text-3xl sm:text-5xl md:text-6xl font-normal uppercase tracking-tight text-white">
                        {title}
                    </h2>
                    <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-400">
                    Placeholder Section &bull; Will be implemented in the next step
                </div>
            </div>

            {/* Bottom Nav Cue */}
            <div className="w-full flex items-center justify-center relative z-10">
                {nextSectionId ? (
                    <a
                        href={`#${nextSectionId}`}
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-lime-400 transition-colors uppercase tracking-wider font-mono font-bold"
                    >
                        <span>Next Section</span>
                        <ChevronDown className="w-4 h-4 text-lime-400" />
                    </a>
                ) : (
                    <a
                        href="#hero"
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-lime-400 transition-colors uppercase tracking-wider font-mono font-bold"
                    >
                        <ArrowUp className="w-4 h-4 text-lime-400" />
                        <span>Back to Top (Hero)</span>
                    </a>
                )}
            </div>
        </section>
    )
}
