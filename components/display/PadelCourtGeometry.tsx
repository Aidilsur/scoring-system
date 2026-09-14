import React from 'react'

/**
 * PadelCourtGeometry
 * Elemen SVG garis tipis geometris motif lapangan padel sesuai panduan docs/design-theme.md §1 & §4.
 * Berfungsi sebagai latar atmosferik broadcast modern tanpa menggunakan foto/gambar atlet.
 */
export function PadelCourtGeometry() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
            {/* Ambient subtle glow at top and center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-emerald-950/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-lime-400/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Geometric Court Outline Lines */}
            <svg
                className="w-full h-full opacity-25"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="courtLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a3e635" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#22c55e" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#a3e635" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Outer Glass Perimeter */}
                <rect
                    x="80"
                    y="60"
                    width="1440"
                    height="780"
                    fill="none"
                    stroke="url(#courtLineGrad)"
                    strokeWidth="1.5"
                    strokeDasharray="8 8"
                />

                {/* Main Court Playing Area (20m x 10m aspect representation) */}
                <rect
                    x="160"
                    y="120"
                    width="1280"
                    height="660"
                    fill="none"
                    stroke="#a3e635"
                    strokeWidth="2"
                    strokeOpacity="0.2"
                />

                {/* Center Net Line */}
                <line
                    x1="800"
                    y1="100"
                    x2="800"
                    y2="800"
                    stroke="#a3e635"
                    strokeWidth="3"
                    strokeOpacity="0.4"
                />

                {/* Center Net Mesh Texture Lines */}
                <line x1="795" y1="120" x2="795" y2="780" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.15" />
                <line x1="805" y1="120" x2="805" y2="780" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.15" />

                {/* Service Boxes - Left Side (3m from back wall) */}
                <line
                    x1="440"
                    y1="120"
                    x2="440"
                    y2="780"
                    stroke="#a3e635"
                    strokeWidth="1.5"
                    strokeOpacity="0.25"
                />
                {/* Center Service Line - Left */}
                <line
                    x1="440"
                    y1="450"
                    x2="800"
                    y2="450"
                    stroke="#a3e635"
                    strokeWidth="1.5"
                    strokeOpacity="0.25"
                />

                {/* Service Boxes - Right Side (3m from back wall) */}
                <line
                    x1="1160"
                    y1="120"
                    x2="1160"
                    y2="780"
                    stroke="#a3e635"
                    strokeWidth="1.5"
                    strokeOpacity="0.25"
                />
                {/* Center Service Line - Right */}
                <line
                    x1="800"
                    y1="450"
                    x2="1160"
                    y2="450"
                    stroke="#a3e635"
                    strokeWidth="1.5"
                    strokeOpacity="0.25"
                />

                {/* Subtle Decorative Grid Crosses at Intersections */}
                <circle cx="800" cy="450" r="4" fill="#a3e635" fillOpacity="0.6" />
                <circle cx="440" cy="450" r="3" fill="#a3e635" fillOpacity="0.4" />
                <circle cx="1160" cy="450" r="3" fill="#a3e635" fillOpacity="0.4" />
            </svg>
        </div>
    )
}
