import React from 'react'
import { HeroSection } from './HeroSection'
import { HomeSectionPlaceholder } from './HomeSectionPlaceholder'
import { HomeCategoriesSection } from './HomeCategoriesSection'
import { HomeHowItWorksSection } from './HomeHowItWorksSection'
import { HomeFooterSection } from './HomeFooterSection'
import { HomeScrollNavigator, HomeSectionItem } from './HomeScrollNavigator'

export interface HomeViewProps {
    tournamentName: string
}

/**
 * Metadata for homepage sections.
 * Module-level constant conforming to docs/component-architecture.md §G.
 */
export const HOME_SECTIONS: readonly HomeSectionItem[] = [
    {
        id: 'hero',
        title: 'Hero',
        shortLabel: 'Hero',
    },
    {
        id: 'categories',
        title: 'Categories',
        shortLabel: 'Categories',
    },
    {
        id: 'tournament-info',
        title: 'Tournament Info',
        shortLabel: 'Info',
    },
    {
        id: 'how-it-works',
        title: 'How It Works',
        shortLabel: 'Flow',
    },
    {
        id: 'footer',
        title: 'Footer & Links',
        shortLabel: 'Footer',
    },
] as const

/**
 * HomeView
 * Composition component for the public landing page.
 * Wraps sections inside a vertical CSS scroll-snap mandatory container
 * with a fixed dot navigator on the right side.
 */
export function HomeView({ tournamentName }: HomeViewProps) {
    return (
        <main
            id="snap-container"
            className="h-screen min-h-screen w-full overflow-y-auto snap-y snap-mandatory scroll-smooth bg-zinc-950 text-zinc-100 relative focus:outline-none"
        >
            {/* Fixed Dot Navigator */}
            <HomeScrollNavigator sections={HOME_SECTIONS} />

            {/* Section 1: Hero */}
            <HeroSection tournamentName={tournamentName} />

            {/* Section 2: Categories */}
            <HomeCategoriesSection />

            {/* Section 3: Tournament Info (Placeholder) */}
            <HomeSectionPlaceholder
                id="tournament-info"
                sectionIndex={3}
                totalSections={5}
                title="Tournament Information"
                category="Schedules & Rules"
                description="Match schedules, court assignments (Court 1 to Court N), and official padel golden point regulations."
                nextSectionId="how-it-works"
            />

            {/* Section 4: How It Works */}
            <HomeHowItWorksSection />

            {/* Section 5: Footer & Links */}
            <HomeFooterSection tournamentName={tournamentName} />
        </main>
    )
}
