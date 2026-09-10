'use client'

import { Toaster as SonnerToaster } from 'sonner'

/**
 * AppToaster
 * Client component wrapper untuk Sonner Toaster
 * Sesuai panduan docs/design-theme.md dan docs/component-architecture.md §J
 */
export function AppToaster() {
    return (
        <SonnerToaster
            position="top-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
                className: '!font-sans !rounded-2xl !border !shadow-2xl !backdrop-blur-md',
                classNames: {
                    toast: '!font-sans !rounded-2xl !border !p-4 !shadow-2xl !text-sm',
                    title: '!font-bold !text-sm leading-snug',
                    description: '!text-xs leading-relaxed opacity-90',
                    actionButton: '!bg-lime-400 !text-zinc-950 !font-bold !rounded-lg !px-3 !py-1.5',
                    cancelButton: '!bg-zinc-800 !text-zinc-300 !rounded-lg !px-3 !py-1.5',
                    closeButton: '!bg-zinc-900/80 !border-zinc-700 !text-zinc-300 hover:!text-white',
                    success: '!bg-[#042115] !border-lime-500/60 !text-lime-300 shadow-lime-500/10',
                    error: '!bg-[#270b0e] !border-rose-500/70 !text-rose-200 shadow-rose-500/10',
                    warning: '!bg-[#261803] !border-amber-500/60 !text-amber-200 shadow-amber-500/10',
                    info: '!bg-[#081829] !border-sky-500/60 !text-sky-200 shadow-sky-500/10',
                },
            }}
        />
    )
}

export default AppToaster
