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
        default: 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800',
        elevated:
            'bg-white dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/40',
        bordered: 'bg-transparent border border-zinc-200 dark:border-zinc-800',
    }

    return (
        <div className={`rounded-3xl p-6 sm:p-8 ${variants[variant]} ${className}`} {...props}>
            {children}
        </div>
    )
}
