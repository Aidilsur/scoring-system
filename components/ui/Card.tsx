import React, { HTMLAttributes } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'bordered'
}

export function Card({
    variant = 'default',
    className = '',
    children,
    ...props
}: CardProps) {
    const variants = {
        default: 'bg-zinc-900/80 border border-zinc-800 text-zinc-100 shadow-xl shadow-black/30',
        elevated:
            'bg-zinc-900/90 backdrop-blur-md border border-zinc-800 shadow-2xl shadow-black/50 text-zinc-100',
        bordered: 'bg-zinc-900/40 border border-zinc-800/80 text-zinc-100',
    }

    return (
        <div className={`rounded-2xl p-6 sm:p-8 ${variants[variant]} ${className}`} {...props}>
            {children}
        </div>
    )
}
