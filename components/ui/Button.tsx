import React, { ButtonHTMLAttributes, forwardRef } from 'react'

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
                    <svg
                        className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-current"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {isLoading && loadingText ? loadingText : children}
            </button>
        )
    }
)

Button.displayName = 'Button'
