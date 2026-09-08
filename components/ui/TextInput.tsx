import React, { forwardRef, InputHTMLAttributes } from 'react'

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    helperText?: string
    required?: boolean
    containerClassName?: string
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
    (
        {
            label,
            error,
            helperText,
            required,
            id,
            name,
            disabled,
            containerClassName = '',
            className = '',
            ...props
        },
        ref
    ) => {
        const inputId = id || name

        return (
            <div className={`space-y-1.5 ${containerClassName}`}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                        {label} {required && <span className="text-rose-500">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    name={name}
                    disabled={disabled}
                    className={`w-full rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/60 px-3.5 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed ${
                        error
                            ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/40'
                            : 'border-zinc-300 dark:border-zinc-700 focus:border-emerald-500'
                    } ${className}`}
                    {...props}
                />
                {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
                {!error && helperText && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{helperText}</p>
                )}
            </div>
        )
    }
)

TextInput.displayName = 'TextInput'
