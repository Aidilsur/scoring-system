import React from 'react'
import {
    UserPlus,
    ShieldCheck,
    Shuffle,
    MonitorPlay,
    Swords,
    Trophy,
} from 'lucide-react'

const WORKFLOW_STEPS = [
    {
        id: 1,
        title: 'Registrasi',
        description: 'Daftarkan tim Anda dan unggah bukti pembayaran pendaftaran.',
        icon: UserPlus,
    },
    {
        id: 2,
        title: 'Verifikasi Admin',
        description: 'Panitia akan mengkurasi peserta dan menyetujui status pendaftaran.',
        icon: ShieldCheck,
    },
    {
        id: 3,
        title: 'Drawing Grup',
        description: 'Sistem membagikan tim ke dalam grup secara otomatis dan adil.',
        icon: Shuffle,
    },
    {
        id: 4,
        title: 'Fase Grup',
        description: 'Pertandingan Round Robin dengan live scoring layar TV.',
        icon: MonitorPlay,
    },
    {
        id: 5,
        title: 'Knockout',
        description: 'Tim terbaik melaju ke babak Semifinal dan Final.',
        icon: Swords,
    },
    {
        id: 6,
        title: 'Juara',
        description: 'Pemenang turnamen ditentukan dari hasil akhir laga pamungkas.',
        icon: Trophy,
    },
] as const

export function HomeHowItWorksSection() {
    return (
        <section
            id="how-it-works"
            className="h-screen min-h-screen w-full snap-start snap-always flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-12 sm:py-16 relative overflow-hidden bg-zinc-950 text-zinc-100"
        >
            {/* Background Geometric Grid Accent (Consistent with Hero) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#a3e635_1px,transparent_1px),linear-gradient(to_bottom,#a3e635_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]"
                aria-hidden="true"
            />

            <div className="max-w-6xl w-full mx-auto relative z-20 space-y-12 sm:space-y-16">
                {/* Section Header */}
                <div className="space-y-3 max-w-2xl text-left">
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono tracking-widest text-lime-400 uppercase">
                        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shadow-sm shadow-lime-400/50 shrink-0" />
                        <span className="font-bold">Sport Tech Flow</span>
                    </div>
                    <h2
                        className="font-[family-name:var(--font-anton)] font-normal uppercase text-white tracking-tight drop-shadow-lg"
                        style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 0.95 }}
                    >
                        HOW IT WORKS
                    </h2>
                    <p className="text-sm sm:text-base lg:text-lg text-zinc-400 leading-relaxed">
                        End-to-end tournament management. Dari pendaftaran hingga penentuan juara, semua terintegrasi dalam satu sistem.
                    </p>
                </div>

                {/* Workflow Timeline Area */}
                <div className="relative">
                    {/* Connecting Line Pattern (Background for Grid) */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[1px] border-t-2 border-dashed border-zinc-800/80 -translate-y-1/2 z-0" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-4 relative z-10">
                        {WORKFLOW_STEPS.map((step) => {
                            const Icon = step.icon
                            return (
                                <div
                                    key={step.id}
                                    className="group flex flex-col items-start lg:items-center relative"
                                >
                                    {/* Mobile/Tablet Connector Line (Vertical) */}
                                    {step.id !== WORKFLOW_STEPS.length && (
                                        <div className="lg:hidden absolute left-[1.15rem] top-12 bottom-[-1.5rem] w-px border-l-2 border-dashed border-zinc-800/80 z-0" />
                                    )}

                                    {/* Icon Box */}
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-950 border-2 border-zinc-800 group-hover:border-lime-400 group-hover:bg-lime-400/10 rounded-xl flex items-center justify-center shrink-0 z-10 transition-colors duration-300">
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400 group-hover:text-lime-400 transition-colors duration-300" />
                                    </div>

                                    {/* Step Label Number */}
                                    <div className="mt-4 lg:mt-6 mb-1.5 font-mono text-[10px] sm:text-xs text-lime-500/70 tracking-widest uppercase font-bold lg:text-center w-full pl-14 lg:pl-0">
                                        Langkah {step.id}
                                    </div>

                                    {/* Content */}
                                    <div className="w-full pl-14 lg:pl-0 lg:text-center space-y-1.5">
                                        <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-lime-300 transition-colors">
                                            {step.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}
