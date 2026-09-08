import React, { ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    isLoading?: boolean
    loadingText?: string
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.99]',
    secondary:
        'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white',
    outline:
        'border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
    danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 active:scale-[0.99]',
    ghost:
        'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
}

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'py-2 px-3.5 text-xs rounded-xl',
    md: 'py-3 px-5 text-sm rounded-xl',
    lg: 'py-4 px-6 text-base rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            loadingText,
            disabled,
            children,
            className = '',
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || isLoading

        return (
            <button
                ref={ref}
                disabled={isDisabled}
                className={`relative inline-flex items-center justify-center font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 ${
                    variantStyles[variant]
                } ${sizeStyles[size]} ${className}`}
                {...props}
            >
                {isLoading && (
                    <Loader2 className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-current" />
                )}
                {isLoading && loadingText ? loadingText : children}
            </button>
        )
    }
)

Button.displayName = 'Button'
