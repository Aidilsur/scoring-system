import React, { HTMLAttributes } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'warning' | 'danger' | 'neutral'
    size?: 'sm' | 'md'
}

export function Badge({
    variant = 'neutral',
    size = 'sm',
    className = '',
    children,
    ...props
}: BadgeProps) {
    const variants = {
        success:
            'bg-lime-400/15 border border-lime-400/30 text-lime-400',
        warning:
            'bg-amber-400/15 border border-amber-400/30 text-amber-300',
        danger:
            'bg-rose-500/15 border border-rose-500/30 text-rose-400',
        neutral:
            'bg-zinc-800/80 border border-zinc-700/60 text-zinc-300',
    }

    const sizes = {
        sm: 'px-2.5 py-1 text-[11px]',
        md: 'px-3.5 py-1.5 text-xs',
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-bold font-mono uppercase tracking-wider ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </span>
    )
}
