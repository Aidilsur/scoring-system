'use client'

import React, { useEffect, useState } from 'react'

export interface HomeSectionItem {
    id: string
    title: string
    shortLabel: string
}

export interface HomeScrollNavigatorProps {
    sections: readonly HomeSectionItem[]
}

/**
 * HomeScrollNavigator
 * Client component for fixed dot navigation on the right side of the screen.
 * Tracks active section using IntersectionObserver and enables smooth scrolling.
 */
export function HomeScrollNavigator({ sections }: HomeScrollNavigatorProps) {
    const [activeId, setActiveId] = useState<string>(sections[0]?.id || 'hero')

    useEffect(() => {
        const observerCallback: IntersectionObserverCallback = (entries) => {
            const intersecting = entries.find((entry) => entry.isIntersecting)
            if (intersecting && intersecting.target.id) {
                setActiveId(intersecting.target.id)
            }
        }

        const observerOptions: IntersectionObserverInit = {
            root: null,
            threshold: 0.5,
        }

        const observer = new IntersectionObserver(observerCallback, observerOptions)

        sections.forEach((sec) => {
            const el = document.getElementById(sec.id)
            if (el) {
                observer.observe(el)
            }
        })

        return () => {
            observer.disconnect()
        }
    }, [sections])

    const scrollTo = (id: string) => {
        const el = document.getElementById(id)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <nav
            aria-label="Section Navigation"
            className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3 bg-zinc-900/80 p-2 sm:p-2.5 rounded-full border border-zinc-800/90 backdrop-blur-md shadow-2xl shadow-black/80"
        >
            {sections.map((sec, index) => {
                const isActive = activeId === sec.id

                return (
                    <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollTo(sec.id)}
                        aria-label={`Scroll to ${sec.title}`}
                        aria-current={isActive ? 'true' : 'false'}
                        className="group relative flex items-center justify-center p-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded-full"
                    >
                        {/* Dot indicator */}
                        <span
                            className={`block rounded-full transition-all duration-300 ease-out ${
                                isActive
                                    ? 'h-6 w-2 bg-lime-400 shadow-md shadow-lime-400/50 ring-2 ring-lime-400/30'
                                    : 'h-2 w-2 bg-zinc-700 hover:bg-zinc-500'
                            }`}
                        />

                        {/* Tooltip on hover (desktop) */}
                        <span className="pointer-events-none absolute right-8 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold text-white bg-zinc-900 border border-zinc-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap hidden sm:block">
                            <span className="text-lime-400 mr-1.5">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            {sec.title}
                        </span>
                    </button>
                )
            })}
        </nav>
    )
}
