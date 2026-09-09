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
                        className="block text-xs font-bold uppercase tracking-wider text-zinc-300"
                    >
                        {label} {required && <span className="text-rose-500">*</span>}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    name={name}
                    disabled={disabled}
                    className={`w-full rounded-xl border bg-zinc-900/90 px-3.5 py-3 text-sm text-white placeholder:text-zinc-500 transition focus:outline-none focus:ring-2 focus:ring-lime-400/40 disabled:opacity-60 disabled:cursor-not-allowed ${
                        error
                            ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/40'
                            : 'border-zinc-800 focus:border-lime-400'
                    } ${className}`}
                    {...props}
                />
                {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
                {!error && helperText && (
                    <p className="text-[11px] text-zinc-400">{helperText}</p>
                )}
            </div>
        )
    }
)

TextInput.displayName = 'TextInput'
