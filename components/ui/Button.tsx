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
        'bg-lime-400 hover:bg-lime-300 text-zinc-950 font-black tracking-wide shadow-lg shadow-lime-400/20 active:scale-[0.99]',
    secondary:
        'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/80 active:scale-[0.99]',
    outline:
        'border border-zinc-700/80 hover:bg-zinc-800 text-zinc-200 active:scale-[0.99]',
    danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 active:scale-[0.99]',
    ghost:
        'hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-100',
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
