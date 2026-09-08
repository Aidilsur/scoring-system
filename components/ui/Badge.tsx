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
            'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        warning:
            'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400',
        danger:
            'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400',
        neutral:
            'bg-zinc-500/10 border border-zinc-500/20 text-zinc-600 dark:text-zinc-400',
    }

    const sizes = {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3.5 py-1.5 text-sm',
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </span>
    )
}
