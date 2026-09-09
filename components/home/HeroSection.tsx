import React from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui'

export interface HeroSectionProps {
    tournamentName: string
}

/**
 * PadelCourtGraphic
 * Flat geometric vector representation of an official padel court (20m x 10m).
 * Pure SVG lines with lime accent, replacing athlete photos with architectural sport precision.
 */
function PadelCourtGraphic() {
    return (
        <div className="absolute right-0 lg:-right-4 xl:right-8 top-1/2 -translate-y-1/2 w-full sm:w-[500px] lg:w-[600px] xl:w-[700px] pointer-events-none select-none opacity-20 lg:opacity-30 transition-opacity duration-700">
            <svg
                viewBox="0 0 600 760"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto"
                aria-hidden="true"
            >
                {/* Outer Glass Wall / Safety Zone Perimeter */}
                <rect
                    x="30"
                    y="30"
                    width="540"
                    height="700"
                    rx="8"
                    stroke="#a3e635"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    className="opacity-40"
                />

                {/* Main Court Perimeter (20m x 10m aspect) */}
                <rect
                    x="60"
                    y="60"
                    width="480"
                    height="640"
                    stroke="#a3e635"
                    strokeWidth="2"
                />

                {/* Net Line (Center) */}
                <line
                    x1="45"
                    y1="380"
                    x2="555"
                    y2="380"
                    stroke="#a3e635"
                    strokeWidth="3"
                />
                {/* Net Posts */}
                <circle cx="50" cy="380" r="4" fill="#a3e635" />
                <circle cx="550" cy="380" r="4" fill="#a3e635" />

                {/* Top Half Service Line (3m from back wall) */}
                <line
                    x1="60"
                    y1="220"
                    x2="540"
                    y2="220"
                    stroke="#a3e635"
                    strokeWidth="1.5"
                />

                {/* Bottom Half Service Line (3m from back wall) */}
                <line
                    x1="60"
                    y1="540"
                    x2="540"
                    y2="540"
                    stroke="#a3e635"
                    strokeWidth="1.5"
                />

                {/* Center Service Line (Runs between the two service lines, crossed by the net) */}
                <line
                    x1="300"
                    y1="220"
                    x2="300"
                    y2="540"
                    stroke="#a3e635"
                    strokeWidth="1.5"
                />

                {/* Back Wall Glass Accent Blocks (Top & Bottom) */}
                <rect
                    x="100"
                    y="45"
                    width="400"
                    height="8"
                    fill="#a3e635"
                    className="opacity-30"
                />
                <rect
                    x="100"
                    y="707"
                    width="400"
                    height="8"
                    fill="#a3e635"
                    className="opacity-30"
                />

                {/* Technical Annotation Specs */}
                <text
                    x="65"
                    y="80"
                    fill="#a3e635"
                    fontSize="9"
                    fontFamily="monospace"
                    letterSpacing="0.2em"
                    className="opacity-60"
                >
                    ZONE A // 10.0M
                </text>
                <text
                    x="65"
                    y="690"
                    fill="#a3e635"
                    fontSize="9"
                    fontFamily="monospace"
                    letterSpacing="0.2em"
                    className="opacity-60"
                >
                    ZONE B // 10.0M
                </text>
                <text
                    x="310"
                    y="370"
                    fill="#a3e635"
                    fontSize="9"
                    fontFamily="monospace"
                    letterSpacing="0.25em"
                    className="opacity-75 font-bold"
                >
                    NET // 0.88M - 0.92M
                </text>
            </svg>
        </div>
    )
}

/**
 * HeroSection
 * Refined Hero Section:
 * - Ultra-large headline font clamp(3.25rem, 11vw, 9.5rem)
 * - Balanced vertical positioning
 * - Subtle technical blueprint grid in background to eliminate empty dead space
 * - Proportionate visual hierarchy: Massive Headline >> Scaled Tagline >> Primary/Outline CTAs
 */
export function HeroSection({ tournamentName }: HeroSectionProps) {
    return (
        <section
            id="hero"
            className="h-screen min-h-screen w-full snap-start snap-always flex flex-col justify-between px-6 sm:px-12 lg:px-20 py-6 sm:py-10 relative overflow-hidden bg-zinc-950 text-zinc-100"
        >
            {/* Technical Blueprint Grid Accent (Subtle Low Opacity across background) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(to_right,#a3e635_1px,transparent_1px),linear-gradient(to_bottom,#a3e635_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_60%,transparent_100%)]"
                aria-hidden="true"
            />

            {/* Subtle Corner Green Undertone Glow (Low Opacity) */}
            <div className="absolute -bottom-32 -left-32 w-[560px] h-[560px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute -top-32 right-1/4 w-96 h-96 bg-lime-400/[0.03] rounded-full blur-[120px] pointer-events-none" />

            {/* Geometric Padel Court Vector Motif (Right Side) */}
            <PadelCourtGraphic />

            {/* Top Navigation Header */}
            <header className="w-full flex items-center justify-between relative z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono tracking-widest text-lime-400 uppercase">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shadow-sm shadow-lime-400/50 shrink-0" />
                        <span className="font-bold truncate">Official Tournament System</span>
                    </div>
                    <span className="hidden md:inline-block text-zinc-800 font-mono text-xs">//</span>
                    <span className="hidden md:inline-block text-zinc-500 font-mono text-[11px] tracking-wider uppercase">
                        Padel Sport Technology
                    </span>
                </div>

                <div className="shrink-0 ml-2">
                    <Link
                        href="/admin/login"
                        className="text-[11px] sm:text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-lime-400 transition-colors py-1.5 px-3 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 backdrop-blur-xs whitespace-nowrap"
                    >
                        <span className="hidden sm:inline">Admin Portal &rarr;</span>
                        <span className="sm:hidden">Admin &rarr;</span>
                    </Link>
                </div>
            </header>

            {/* Main Content Area: Vertically Balanced & Dominant Headline */}
            <div className="max-w-5xl my-auto py-4 sm:py-6 pr-8 sm:pr-0 text-left relative z-20 space-y-6 sm:space-y-8">
                {/* Secondary Telemetry Badge */}
                <div className="flex items-center gap-2.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900/80 border border-zinc-800/90 text-zinc-400 font-mono text-xs tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                        <span>Live Season 2026</span>
                    </div>
                </div>

                {/* Massive Focal Headline with Anton Font clamp */}
                <h1
                    className="font-[family-name:var(--font-anton)] font-normal uppercase text-white tracking-tight drop-shadow-xl select-none"
                    style={{
                        fontSize: 'clamp(3.5rem, 11vw, 9.5rem)',
                        lineHeight: 0.88,
                        wordBreak: 'break-word',
                    }}
                >
                    {tournamentName}
                </h1>

                {/* Scaled Tagline (Clear Hierarchical Step Down) */}
                <p className="text-base sm:text-2xl lg:text-[1.75rem] text-zinc-300 max-w-xl font-normal leading-snug tracking-normal">
                    Real-Time Padel Tournament Scoring System
                </p>

                {/* Call-to-Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1 sm:pt-2">
                    {/* Primary CTA: Register Now */}
                    <Link href="/register" className="w-full sm:w-auto">
                        <Button
                            type="button"
                            size="lg"
                            className="w-full sm:w-auto !bg-lime-400 hover:!bg-lime-300 !text-zinc-950 !font-black text-sm sm:text-base tracking-wide rounded-xl px-9 py-4.5 shadow-xl shadow-lime-400/25 active:scale-[0.99] transition-all cursor-pointer"
                        >
                            <span>Register Now</span>
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>

                    {/* Secondary CTA: View Tournament Info */}
                    <a href="#tournament-info" className="w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="w-full sm:w-auto border-zinc-800 hover:border-lime-400/60 bg-zinc-900/60 hover:bg-zinc-800/90 !text-zinc-200 !font-bold text-sm sm:text-base rounded-xl px-9 py-4.5 transition-all cursor-pointer"
                        >
                            <span>View Tournament Info</span>
                            <ChevronDown className="w-4 h-4 ml-2 text-lime-400" />
                        </Button>
                    </a>
                </div>
            </div>

            {/* Bottom Footer Row: Minimal Scroll Cue + Telemetry */}
            <footer className="w-full flex items-center justify-between text-xs text-zinc-500 font-mono tracking-widest relative z-20 shrink-0">
                <a
                    href="#categories"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-lime-400 transition-colors uppercase font-bold"
                >
                    <span>Scroll to explore</span>
                    <ChevronDown className="w-3.5 h-3.5 text-lime-400 animate-bounce" />
                </a>

                <div className="hidden sm:block text-[11px] uppercase tracking-wider text-zinc-500 font-mono">
                    Live Scoring &bull; Smart Draw &bull; TV Broadcast
                </div>
            </footer>
        </section>
    )
}
