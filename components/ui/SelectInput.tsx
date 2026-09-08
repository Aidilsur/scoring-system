import React, { forwardRef, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    helperText?: string
    required?: boolean
    options?: SelectOption[]
    placeholder?: string
    containerClassName?: string
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
    (
        {
            label,
            error,
            helperText,
            required,
            id,
            name,
            disabled,
            options,
            placeholder,
            children,
            containerClassName = '',
            className = '',
            ...props
        },
        ref
    ) => {
        const selectId = id || name

        return (
            <div className={`space-y-1.5 ${containerClassName}`}>
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                    >
                        {label} {required && <span className="text-rose-500">*</span>}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        name={name}
                        disabled={disabled}
                        className={`w-full appearance-none rounded-xl border bg-zinc-50/50 dark:bg-zinc-800/60 px-4 py-3.5 pr-10 text-sm font-medium text-zinc-900 dark:text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed ${
                            error
                                ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/40'
                                : 'border-zinc-300 dark:border-zinc-700 focus:border-emerald-500'
                        } ${className}`}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options
                            ? options.map((opt) => (
                                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                      {opt.label}
                                  </option>
                              ))
                            : children}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>
                {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
                {!error && helperText && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{helperText}</p>
                )}
            </div>
        )
    }
)

SelectInput.displayName = 'SelectInput'
